#!/usr/bin/env bun
/**
 * detect-phase — detect current extraction phase and recover workflow state
 *
 * Two modes:
 *
 *   1. Detect (default)
 *      Read progress.json if available, otherwise infer the current phase
 *      from .riviere/ artifacts. Output a human-readable summary (or JSON).
 *
 *   2. Record (--step + --status)
 *      Update progress.json with a step transition (started / completed).
 *      Called by step orchestrators at the start and end of each step.
 *
 * Phase order:
 *   setup → explore → configure → extract → connect → annotate → validate → complete
 *
 * Usage:
 *   bun detect-phase.ts                                          # detect and display
 *   bun detect-phase.ts --json                                   # detect, output JSON
 *   bun detect-phase.ts --step extract --status started          # record step start
 *   bun detect-phase.ts --step extract --status completed        # record step end
 *   bun detect-phase.ts --help
 *
 * Exit codes:
 *   0 — success
 *   1 — invalid usage
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
detect-phase — detect current extraction phase and recover workflow state

DETECT MODE (default):
  Reads progress.json (authoritative) or infers phase from .riviere/ artifacts.
  Outputs a summary the agent can use to resume after context compaction.

RECORD MODE (--step + --status):
  Updates progress.json with a step transition.
  Called by step orchestrators at step boundaries.

PHASE ORDER
  setup → explore → configure → extract → connect → annotate → validate → complete

USAGE
  bun detect-phase.ts [options]

OPTIONS
  --project-root <dir>           Resolve .riviere/ relative to this directory (default: cwd)
  --step <name>                  Step name to record (requires --status)
  --status started|completed     Step transition to record (requires --step)
  --json                         Output as JSON instead of human-readable
  --help, -h                     Show this message

EXAMPLES
  bun detect-phase.ts --project-root /path/to/project
  bun detect-phase.ts --project-root /path/to/project --json
  bun detect-phase.ts --project-root /path/to/project --step extract --status started
  bun detect-phase.ts --project-root /path/to/project --step extract --status completed
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const projectRootIdx = args.indexOf("--project-root");
const PROJECT_ROOT = resolve(
  projectRootIdx >= 0 && args[projectRootIdx + 1] ? args[projectRootIdx + 1] : "."
);

const JSON_MODE = args.includes("--json");

const stepIdx = args.indexOf("--step");
const STEP_NAME = stepIdx >= 0 ? args[stepIdx + 1] ?? null : null;

const statusIdx = args.indexOf("--status");
const STEP_STATUS = statusIdx >= 0 ? args[statusIdx + 1] ?? null : null;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "setup",
  "explore",
  "configure",
  "extract",
  "connect",
  "annotate",
  "validate",
  "complete",
] as const;

type StepName = (typeof STEPS)[number];

const STEP_FILES: Record<string, string> = {
  setup: "steps/setup.md",
  explore: "steps/explore-orchestrator.md",
  configure: "steps/configure-orchestrator.md",
  extract: "steps/extract-orchestrator.md",
  connect: "steps/connect-orchestrator.md",
  annotate: "steps/annotate-orchestrator.md",
  validate: "steps/validate-orchestrator.md",
};

const STEP_LABELS: Record<string, string> = {
  setup: "Setup",
  explore: "Step 1 — Explore",
  configure: "Step 2 — Configure",
  extract: "Step 3 — Extract",
  connect: "Step 4 — Connect",
  annotate: "Step 5 — Annotate",
  validate: "Step 6 — Validate",
  complete: "Complete",
};

// ─── Paths ────────────────────────────────────────────────────────────────────

const RIVIERE_DIR = resolve(PROJECT_ROOT, ".riviere");
const WORK_DIR = resolve(RIVIERE_DIR, "work");
const CONFIG_DIR = resolve(RIVIERE_DIR, "config");
const PROGRESS_FILE = resolve(WORK_DIR, "progress.json");

// ─── Types ────────────────────────────────────────────────────────────────────

interface Progress {
  currentStep: string;
  currentStepStatus: "started" | "completed";
  completedSteps: string[];
  projectRoot: string;
  repoRoots: Record<string, string>;
  domains: string[];
  stats: {
    metaFiles: number;
    extractFiles: number;
    components: number;
    linkCandidates: number;
    graphExists: boolean;
  };
  detectionSource: "progress.json" | "artifact-inference";
  lastUpdated: string;
  nextStep: string | null;
  nextStepFile: string | null;
}

// ─── Artifact readers ─────────────────────────────────────────────────────────

function listFiles(dir: string, prefix: string, suffix: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(
    (f) => f.startsWith(prefix) && f.endsWith(suffix)
  );
}

/** Extract repo roots from meta-{repo}.md files */
function readRepoRoots(): Record<string, string> {
  const roots: Record<string, string> = {};
  const metaFiles = listFiles(WORK_DIR, "meta-", ".md");
  for (const file of metaFiles) {
    const repoName = file.replace(/^meta-/, "").replace(/\.md$/, "");
    const content = readFileSync(resolve(WORK_DIR, file), "utf8");
    const match = content.match(/[-*]\s+Root:\s*(.+)/);
    if (match) roots[repoName] = match[1].trim();
  }
  return roots;
}

/** Extract domain names from config/domains.md */
function readDomains(): string[] {
  const domainsPath = resolve(CONFIG_DIR, "domains.md");
  if (!existsSync(domainsPath)) return [];
  const content = readFileSync(domainsPath, "utf8");
  const lines = content.split("\n");

  // Find the table, extract domain names from first column
  const domains: string[] = [];
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && !inTable) {
      inTable = true;
      continue; // skip header row
    }
    if (inTable && trimmed.startsWith("|")) {
      // Skip separator row
      if (!trimmed.replace(/[|\-:\s]/g, "").trim()) continue;
      const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells[0]) domains.push(cells[0]);
    } else if (inTable && !trimmed.startsWith("|")) {
      break;
    }
  }
  return domains;
}

/** Count components across extract JSONL files */
function countComponents(): number {
  const files = listFiles(WORK_DIR, "extract-", ".jsonl");
  let count = 0;
  for (const file of files) {
    const lines = readFileSync(resolve(WORK_DIR, file), "utf8")
      .split("\n")
      .filter((l) => l.trim());
    count += lines.length;
  }
  return count;
}

/** Count link candidates */
function countLinkCandidates(): number {
  const path = resolve(WORK_DIR, "link-candidates.jsonl");
  if (!existsSync(path)) return 0;
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim()).length;
}

/** Check if graph.json exists */
function graphExists(): boolean {
  // Check common locations
  return (
    existsSync(resolve(RIVIERE_DIR, "graph.json")) ||
    existsSync(resolve(PROJECT_ROOT, "graph.json"))
  );
}

// ─── Phase detection from artifacts ───────────────────────────────────────────

function detectPhaseFromArtifacts(): { step: string; status: "started" | "completed" } {
  if (!existsSync(RIVIERE_DIR)) {
    return { step: "setup", status: "started" };
  }

  // Check from latest to earliest
  const hasSourceHash = existsSync(resolve(CONFIG_DIR, "source-hash.json"));
  if (hasSourceHash) {
    return { step: "complete", status: "completed" };
  }

  // Check for enrichment replay report (annotate step output)
  const hasEnrichReport = existsSync(resolve(WORK_DIR, "enrichment-replay-report.json"));
  if (hasEnrichReport) {
    return { step: "annotate", status: "completed" };
  }

  // Check for enrichment staging files (annotate in progress)
  const enrichFiles = listFiles(WORK_DIR, "enrich-", ".jsonl");
  if (enrichFiles.length > 0) {
    return { step: "annotate", status: "started" };
  }

  // Check for link replay report (connect step output)
  const hasLinkReport = existsSync(resolve(WORK_DIR, "link-replay-report.json"));
  if (hasLinkReport) {
    return { step: "connect", status: "completed" };
  }

  // Check for link candidates (connect step)
  const hasLinkCandidates = existsSync(resolve(WORK_DIR, "link-candidates.jsonl"));
  if (hasLinkCandidates) {
    return { step: "connect", status: "started" };
  }

  // Check for component replay report (extract step output)
  const hasComponentReport = existsSync(resolve(WORK_DIR, "component-replay-report.json"));
  if (hasComponentReport) {
    return { step: "extract", status: "completed" };
  }

  // Check for extract JSONL files
  const extractFiles = listFiles(WORK_DIR, "extract-", ".jsonl");
  if (extractFiles.length > 0) {
    return { step: "extract", status: "started" };
  }

  // Check for graph initialization (marks end of configure / start of extract)
  if (graphExists()) {
    return { step: "extract", status: "started" };
  }

  // Check for domains.md (configure step output)
  const hasDomains = existsSync(resolve(CONFIG_DIR, "domains.md"));
  if (hasDomains) {
    return { step: "configure", status: "completed" };
  }

  // Check for meta files (explore step output)
  const metaFiles = listFiles(WORK_DIR, "meta-", ".md");
  if (metaFiles.length > 0) {
    return { step: "explore", status: "completed" };
  }

  // .riviere/ exists but no work artifacts
  if (existsSync(WORK_DIR)) {
    return { step: "setup", status: "completed" };
  }

  return { step: "setup", status: "started" };
}

// ─── Next step logic ──────────────────────────────────────────────────────────

function getNextStep(currentStep: string, currentStatus: string): { step: string | null; file: string | null } {
  if (currentStep === "complete") return { step: null, file: null };

  const idx = STEPS.indexOf(currentStep as StepName);
  if (idx === -1) return { step: null, file: null };

  if (currentStatus === "completed") {
    const next = STEPS[idx + 1];
    return next ? { step: next, file: STEP_FILES[next] ?? null } : { step: null, file: null };
  }

  // Status is "started" — the current step is in progress
  return { step: currentStep, file: STEP_FILES[currentStep] ?? null };
}

// ─── Build progress object ───────────────────────────────────────────────────

function buildProgress(
  step: string,
  status: "started" | "completed",
  source: "progress.json" | "artifact-inference",
  existingCompleted?: string[]
): Progress {
  const repoRoots = readRepoRoots();
  const domains = readDomains();
  const metaFiles = listFiles(WORK_DIR, "meta-", ".md");
  const extractFiles = listFiles(WORK_DIR, "extract-", ".jsonl");
  const components = countComponents();
  const linkCandidates = countLinkCandidates();

  // Build completed steps list
  let completedSteps: string[];
  if (existingCompleted) {
    completedSteps = existingCompleted;
  } else {
    const idx = STEPS.indexOf(step as StepName);
    if (status === "completed") {
      completedSteps = STEPS.slice(0, idx + 1) as unknown as string[];
    } else {
      completedSteps = idx > 0 ? (STEPS.slice(0, idx) as unknown as string[]) : [];
    }
  }

  const next = getNextStep(step, status);

  return {
    currentStep: step,
    currentStepStatus: status,
    completedSteps,
    projectRoot: PROJECT_ROOT,
    repoRoots,
    domains,
    stats: {
      metaFiles: metaFiles.length,
      extractFiles: extractFiles.length,
      components,
      linkCandidates,
      graphExists: graphExists(),
    },
    detectionSource: source,
    lastUpdated: new Date().toISOString(),
    nextStep: next.step,
    nextStepFile: next.file,
  };
}

// ─── Write progress.json ─────────────────────────────────────────────────────

function writeProgress(progress: Progress): void {
  if (!existsSync(WORK_DIR)) {
    mkdirSync(WORK_DIR, { recursive: true });
  }
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2) + "\n", "utf8");
}

// ─── Read existing progress.json ─────────────────────────────────────────────

function readProgress(): Progress | null {
  if (!existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8")) as Progress;
  } catch {
    return null;
  }
}

// ─── Human-readable output ───────────────────────────────────────────────────

function printHuman(progress: Progress): void {
  const label = STEP_LABELS[progress.currentStep] ?? progress.currentStep;
  const statusEmoji = progress.currentStepStatus === "completed" ? "✓" : "…";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  EXTRACTION STATE RECOVERY`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Phase:       ${label} ${statusEmoji}`);
  console.log(`  Status:      ${progress.currentStepStatus}`);
  console.log(`  Source:      ${progress.detectionSource}`);
  console.log(`  Project:     ${progress.projectRoot}`);

  if (progress.completedSteps.length > 0) {
    console.log(`  Completed:   ${progress.completedSteps.join(" → ")}`);
  }

  if (Object.keys(progress.repoRoots).length > 0) {
    console.log(`\n  Repositories:`);
    for (const [name, root] of Object.entries(progress.repoRoots)) {
      console.log(`    ${name.padEnd(28)} → ${root}`);
    }
  }

  if (progress.domains.length > 0) {
    console.log(`  Domains:     ${progress.domains.join(", ")}`);
  }

  console.log(`\n  Stats:`);
  console.log(`    Meta files:      ${progress.stats.metaFiles}`);
  console.log(`    Extract files:   ${progress.stats.extractFiles}`);
  console.log(`    Components:      ${progress.stats.components}`);
  console.log(`    Link candidates: ${progress.stats.linkCandidates}`);
  console.log(`    Graph exists:    ${progress.stats.graphExists ? "yes" : "no"}`);

  if (progress.nextStep && progress.nextStepFile) {
    const nextLabel = STEP_LABELS[progress.nextStep] ?? progress.nextStep;
    console.log(`\n  Next: Read ${progress.nextStepFile} (${nextLabel})`);
  } else if (progress.currentStep === "complete") {
    console.log(`\n  ✓ Extraction complete. Graph is ready.`);
  }

  console.log(`${"═".repeat(60)}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// RECORD MODE: update progress.json with step transition
if (STEP_NAME && STEP_STATUS) {
  if (!STEPS.includes(STEP_NAME as StepName)) {
    console.error(`Error: Unknown step "${STEP_NAME}". Valid steps: ${STEPS.join(", ")}`);
    process.exit(1);
  }
  if (STEP_STATUS !== "started" && STEP_STATUS !== "completed") {
    console.error(`Error: --status must be "started" or "completed", got "${STEP_STATUS}"`);
    process.exit(1);
  }

  // Read existing progress to preserve completed steps
  const existing = readProgress();
  let completedSteps: string[] = existing?.completedSteps ?? [];

  if (STEP_STATUS === "completed" && !completedSteps.includes(STEP_NAME)) {
    completedSteps.push(STEP_NAME);
  }

  const progress = buildProgress(
    STEP_NAME,
    STEP_STATUS as "started" | "completed",
    "progress.json",
    completedSteps
  );
  writeProgress(progress);

  const label = STEP_LABELS[STEP_NAME] ?? STEP_NAME;
  console.log(`✓ Progress recorded: ${label} — ${STEP_STATUS}`);
  process.exit(0);
}

if ((STEP_NAME && !STEP_STATUS) || (!STEP_NAME && STEP_STATUS)) {
  console.error("Error: --step and --status must be used together.");
  process.exit(1);
}

// DETECT MODE: read progress or infer from artifacts
const existing = readProgress();
let progress: Progress;

if (existing) {
  // Refresh stats from current artifacts while keeping authoritative step state
  progress = buildProgress(
    existing.currentStep,
    existing.currentStepStatus,
    "progress.json",
    existing.completedSteps
  );
} else {
  const detected = detectPhaseFromArtifacts();
  progress = buildProgress(detected.step, detected.status, "artifact-inference");
  // Write the inferred progress so future reads are faster
  writeProgress(progress);
}

if (JSON_MODE) {
  console.log(JSON.stringify(progress, null, 2));
} else {
  printHuman(progress);
}
