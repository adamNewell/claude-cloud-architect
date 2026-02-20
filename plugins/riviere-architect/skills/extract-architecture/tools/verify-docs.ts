#!/usr/bin/env bun
/**
 * verify-docs — cross-reference graph against documentation
 *
 * Reads the architecture graph components, domain registry, and trace map
 * to identify documentation gaps: undocumented domains, critical flows
 * without descriptions, and documented features without matching components.
 *
 * Output: .riviere/work/doc-verification.json
 *
 * Usage:
 *   bun verify-docs.ts --project-root /path/to/project
 *   bun verify-docs.ts --help
 *
 * Exit codes:
 *   0 — success
 *   1 — invalid usage or filesystem error
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, join, basename } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
verify-docs — cross-reference graph against documentation

Identifies documentation gaps by comparing extracted components and domains
against available documentation and the trace map.

USAGE
  bun verify-docs.ts [options]

OPTIONS
  --project-root <dir>   Resolve .riviere/ relative to this directory (default: cwd)
  --help, -h             Show this message

OUTPUT
  .riviere/work/doc-verification.json

EXAMPLES
  bun verify-docs.ts --project-root /path/to/project
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

const WORK_DIR = resolve(PROJECT_ROOT, ".riviere/work");
const CONFIG_DIR = resolve(PROJECT_ROOT, ".riviere/config");

// ─── Types ────────────────────────────────────────────────────────────────────

interface Component {
  id: string;
  name: string;
  domain?: string;
  module?: string;
  type?: string;
  [key: string]: unknown;
}

interface DomainEntry {
  name: string;
  type?: string;
  description?: string;
  repositories?: string[];
}

interface TraceEntry {
  feature: string;
  direction: "doc-to-code" | "code-to-doc";
  docSource?: string;
  docSources?: string[];
  component?: string;
  components?: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  gap?: string;
}

interface Finding {
  type: "undocumented_domain" | "undocumented_flow" | "unimplemented_feature";
  domain?: string;
  flow?: string;
  feature?: string;
  docSource?: string;
  severity: "warning" | "info";
  message: string;
}

interface VerificationResult {
  version: string;
  generatedAt: string;
  findings: Finding[];
  coverage: {
    documentedDomains: number;
    totalDomains: number;
    documentedComponents: number;
    totalComponents: number;
    coveragePercent: number;
  };
}

// ─── Data readers ─────────────────────────────────────────────────────────────

function readComponents(): Component[] {
  if (!existsSync(WORK_DIR)) return [];

  const files = readdirSync(WORK_DIR).filter(
    (f) => f.startsWith("extract-") && f.endsWith(".jsonl")
  );

  const components: Component[] = [];
  for (const file of files) {
    const content = readFileSync(resolve(WORK_DIR, file), "utf8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.id || obj.name) {
          components.push(obj as Component);
        }
      } catch {
        // skip malformed
      }
    }
  }
  return components;
}

function readDomains(): DomainEntry[] {
  // v2: JSON
  const jsonPath = resolve(CONFIG_DIR, "domains.json");
  if (existsSync(jsonPath)) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf8"));
      if (data.domains && Array.isArray(data.domains)) {
        return data.domains;
      }
    } catch { /* fall through */ }
  }

  return [];
}

function readTraceMap(): TraceEntry[] {
  const tracePath = resolve(WORK_DIR, "trace-map.jsonl");
  if (!existsSync(tracePath)) return [];

  const entries: TraceEntry[] = [];
  const content = readFileSync(tracePath, "utf8");
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as TraceEntry);
    } catch {
      // skip malformed
    }
  }
  return entries;
}

/**
 * Check if a domain has wiki/doc content by searching for files
 * that reference the domain name.
 */
function findDocFilesForDomain(domainName: string): string[] {
  const docDirs = [
    resolve(PROJECT_ROOT, "wiki"),
    resolve(PROJECT_ROOT, "docs"),
  ];

  const matchingFiles: string[] = [];
  const lowerDomain = domainName.toLowerCase();

  for (const dir of docDirs) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;

    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".rst")
    );

    for (const file of files) {
      const fileName = basename(file, ".md").toLowerCase();
      // Check if file name matches domain
      if (fileName.includes(lowerDomain) || lowerDomain.includes(fileName)) {
        matchingFiles.push(join(dir, file));
        continue;
      }
      // Check file content for domain mention
      const content = readFileSync(resolve(dir, file), "utf8").toLowerCase();
      if (content.includes(lowerDomain)) {
        matchingFiles.push(join(dir, file));
      }
    }
  }

  // Also check root README
  const readmePath = resolve(PROJECT_ROOT, "README.md");
  if (existsSync(readmePath)) {
    const content = readFileSync(readmePath, "utf8").toLowerCase();
    if (content.includes(lowerDomain)) {
      matchingFiles.push(readmePath);
    }
  }

  return matchingFiles;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const components = readComponents();
  const domains = readDomains();
  const traceEntries = readTraceMap();

  console.log(`Loaded ${components.length} component(s), ${domains.length} domain(s), ${traceEntries.length} trace entries.`);

  const findings: Finding[] = [];

  // ── 1. Domains without wiki content ──
  const documentedDomainNames = new Set<string>();

  for (const domain of domains) {
    const docFiles = findDocFilesForDomain(domain.name);
    if (docFiles.length > 0) {
      documentedDomainNames.add(domain.name);
    } else {
      findings.push({
        type: "undocumented_domain",
        domain: domain.name,
        severity: "warning",
        message: `Domain '${domain.name}' has no wiki content`,
      });
    }
  }

  // ── 2. Critical flows without doc descriptions ──
  // Critical flow = API -> UseCase -> DomainOp chain within same domain
  const componentsByDomain = new Map<string, Component[]>();
  for (const comp of components) {
    const domain = comp.domain ?? "unknown";
    if (!componentsByDomain.has(domain)) {
      componentsByDomain.set(domain, []);
    }
    componentsByDomain.get(domain)!.push(comp);
  }

  for (const [domain, domainComponents] of componentsByDomain) {
    const apis = domainComponents.filter((c) => c.type === "API" || c.type === "api");
    const useCases = domainComponents.filter(
      (c) => c.type === "UseCase" || c.type === "usecase" || c.type === "use-case"
    );
    const domainOps = domainComponents.filter(
      (c) => c.type === "DomainOp" || c.type === "domainop" || c.type === "domain-op"
    );

    // If all three layers exist, it's a critical flow
    if (apis.length > 0 && useCases.length > 0 && domainOps.length > 0) {
      // Check if this domain's flow has any HIGH confidence doc coverage in trace
      const domainTraceEntries = traceEntries.filter((e) => {
        if (e.direction === "doc-to-code" && e.components) {
          return e.components.some((c) => c.toLowerCase().startsWith(domain.toLowerCase() + ":"));
        }
        if (e.direction === "code-to-doc" && e.component) {
          return e.component.toLowerCase().startsWith(domain.toLowerCase() + ":");
        }
        return false;
      });

      const hasHighCoverage = domainTraceEntries.some((e) => e.confidence === "HIGH");
      if (!hasHighCoverage) {
        findings.push({
          type: "undocumented_flow",
          flow: `${domain}-flow`,
          severity: "info",
          message: `Critical flow in domain '${domain}' (API -> UseCase -> DomainOp chain) has no documentation`,
        });
      }
    }
  }

  // ── 3. Doc features without matching components (from trace map) ──
  const docToCodeEntries = traceEntries.filter((e) => e.direction === "doc-to-code");
  const codeToDocEntries = traceEntries.filter((e) => e.direction === "code-to-doc");

  // Find doc sections that had zero component matches (these would not appear in doc-to-code)
  // We detect this via trace entries where doc-to-code confidence is LOW or missing
  // But since build-trace-map only creates doc-to-code for matched sections,
  // unmatched doc sections are not in the trace. We look for features mentioned
  // in docs but not found in code-to-doc direction.
  const documentedComponentIds = new Set(
    codeToDocEntries
      .filter((e) => e.confidence !== "LOW" && !e.gap)
      .map((e) => e.component)
      .filter(Boolean)
  );

  // Check if any doc-to-code entries reference components that are all LOW confidence
  for (const entry of docToCodeEntries) {
    if (entry.components && entry.components.length === 0) {
      findings.push({
        type: "unimplemented_feature",
        feature: entry.feature,
        docSource: entry.docSource,
        severity: "warning",
        message: `Documented feature '${entry.feature}' has no matching components`,
      });
    }
  }

  // ── Compute coverage stats ──
  const documentedComponentCount = codeToDocEntries.filter(
    (e) => e.confidence !== "LOW" && !e.gap
  ).length;

  // If no trace map, fall back to basic doc file matching
  const totalComponents = components.length;
  const totalDomains = domains.length;
  const coveragePercent = totalComponents > 0
    ? Math.round((documentedComponentCount / totalComponents) * 100)
    : 0;

  const result: VerificationResult = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    findings,
    coverage: {
      documentedDomains: documentedDomainNames.size,
      totalDomains,
      documentedComponents: documentedComponentCount,
      totalComponents,
      coveragePercent,
    },
  };

  // Write output
  mkdirSync(WORK_DIR, { recursive: true });
  const outputPath = resolve(WORK_DIR, "doc-verification.json");
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  // Summary
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");

  console.log(`\nDoc Verification Summary:`);
  console.log(`  Warnings:            ${warnings.length}`);
  console.log(`  Info:                ${infos.length}`);
  console.log(`  Documented domains:  ${documentedDomainNames.size} / ${totalDomains}`);
  console.log(`  Documented components: ${documentedComponentCount} / ${totalComponents}`);
  console.log(`  Coverage:            ${coveragePercent}%`);

  if (warnings.length > 0) {
    console.log(`\nWarnings:`);
    for (const w of warnings) {
      console.log(`  - ${w.message}`);
    }
  }

  if (infos.length > 0) {
    console.log(`\nInfo:`);
    for (const i of infos) {
      console.log(`  - ${i.message}`);
    }
  }

  console.log(`\nOutput: ${outputPath}`);
}

main();
