#!/usr/bin/env bun
/**
 * build-trace-map — create bidirectional feature-to-code traceability mappings
 *
 * Reads extracted components from .riviere/work/extract-*.jsonl and scans
 * available documentation (wiki/, README.md, docs/) to build trace entries
 * that map features to components and flag undocumented code.
 *
 * Output: .riviere/work/trace-map.jsonl
 *
 * Usage:
 *   bun build-trace-map.ts --project-root /path/to/project
 *   bun build-trace-map.ts --help
 *
 * Exit codes:
 *   0 — success
 *   1 — invalid usage or filesystem error
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, join, basename, relative } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
build-trace-map — create bidirectional feature-to-code traceability mappings

Reads extracted components and scans documentation to build trace entries
mapping features to components and identifying documentation gaps.

USAGE
  bun build-trace-map.ts [options]

OPTIONS
  --project-root <dir>   Resolve .riviere/ relative to this directory (default: cwd)
  --help, -h             Show this message

OUTPUT
  .riviere/work/trace-map.jsonl

EXAMPLES
  bun build-trace-map.ts --project-root /path/to/project
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
  filePath?: string;
  [key: string]: unknown;
}

interface DocSection {
  source: string;
  heading: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  keywords: string[];
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

// ─── Component reading ───────────────────────────────────────────────────────

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
        // skip malformed lines
      }
    }
  }
  return components;
}

// ─── Documentation scanning ──────────────────────────────────────────────────

function findDocFiles(rootDir: string): string[] {
  const docFiles: string[] = [];

  // Wiki directory
  const wikiDir = resolve(rootDir, "wiki");
  if (existsSync(wikiDir) && statSync(wikiDir).isDirectory()) {
    const wikiFiles = readdirSync(wikiDir).filter(
      (f) => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".rst")
    );
    for (const f of wikiFiles) {
      docFiles.push(resolve(wikiDir, f));
    }
  }

  // Root README
  const readmePath = resolve(rootDir, "README.md");
  if (existsSync(readmePath)) {
    docFiles.push(readmePath);
  }

  // Docs directory
  const docsDir = resolve(rootDir, "docs");
  if (existsSync(docsDir) && statSync(docsDir).isDirectory()) {
    const docsFiles = readdirSync(docsDir).filter(
      (f) => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".rst")
    );
    for (const f of docsFiles) {
      docFiles.push(resolve(docsDir, f));
    }
  }

  // Also check repo roots from meta files
  const repoRoots = readRepoRoots();
  for (const root of Object.values(repoRoots)) {
    if (root === rootDir) continue; // already covered
    const repoReadme = resolve(root, "README.md");
    if (existsSync(repoReadme) && !docFiles.includes(repoReadme)) {
      docFiles.push(repoReadme);
    }
    const repoWiki = resolve(root, "wiki");
    if (existsSync(repoWiki) && statSync(repoWiki).isDirectory()) {
      const files = readdirSync(repoWiki).filter((f) => f.endsWith(".md"));
      for (const f of files) {
        const fullPath = resolve(repoWiki, f);
        if (!docFiles.includes(fullPath)) docFiles.push(fullPath);
      }
    }
    const repoDocs = resolve(root, "docs");
    if (existsSync(repoDocs) && statSync(repoDocs).isDirectory()) {
      const files = readdirSync(repoDocs).filter((f) => f.endsWith(".md"));
      for (const f of files) {
        const fullPath = resolve(repoDocs, f);
        if (!docFiles.includes(fullPath)) docFiles.push(fullPath);
      }
    }
  }

  return docFiles;
}

function readRepoRoots(): Record<string, string> {
  const roots: Record<string, string> = {};

  if (!existsSync(WORK_DIR)) return roots;

  // v2: JSONL meta files
  const jsonlFiles = readdirSync(WORK_DIR).filter(
    (f) => f.startsWith("meta-") && f.endsWith(".jsonl")
  );
  if (jsonlFiles.length > 0) {
    for (const file of jsonlFiles) {
      const repoName = file.replace(/^meta-/, "").replace(/\.jsonl$/, "");
      const content = readFileSync(resolve(WORK_DIR, file), "utf8");
      for (const line of content.split("\n")) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.facet === "structure" && obj.root) {
            roots[repoName] = obj.root;
            break;
          }
        } catch { /* skip */ }
      }
    }
    return roots;
  }

  return roots;
}

/**
 * Parse markdown document into sections by heading.
 */
function parseDocSections(filePath: string): DocSection[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const sections: DocSection[] = [];
  const relPath = relative(PROJECT_ROOT, filePath);

  let currentHeading = basename(filePath, ".md");
  let currentContent: string[] = [];
  let currentStart = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,4}\s+(.+)/);

    if (headingMatch) {
      // Save previous section if it has content
      if (currentContent.length > 0) {
        const text = currentContent.join("\n");
        sections.push({
          source: relPath,
          heading: currentHeading,
          content: text,
          lineStart: currentStart,
          lineEnd: i,
          keywords: extractKeywords(currentHeading + " " + text),
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [];
      currentStart = i + 1;
    } else {
      currentContent.push(line);
    }
  }

  // Final section
  if (currentContent.length > 0) {
    const text = currentContent.join("\n");
    sections.push({
      source: relPath,
      heading: currentHeading,
      content: text,
      lineStart: currentStart,
      lineEnd: lines.length,
      keywords: extractKeywords(currentHeading + " " + text),
    });
  }

  return sections;
}

/**
 * Extract meaningful keywords from text for matching.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "because", "but", "and", "or", "if", "while",
    "this", "that", "these", "those", "it", "its", "they", "them", "their",
    "we", "us", "our", "you", "your", "he", "him", "his", "she", "her",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
}

// ─── Matching logic ──────────────────────────────────────────────────────────

function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/[-_:.]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Score how well a component matches a doc section.
 * Returns: "HIGH" | "MEDIUM" | "LOW"
 */
function scoreMatch(component: Component, section: DocSection): "HIGH" | "MEDIUM" | "LOW" {
  const compId = (component.id ?? "").toLowerCase();
  const compName = (component.name ?? "").toLowerCase();
  const compDomain = (component.domain ?? "").toLowerCase();
  const compModule = (component.module ?? "").toLowerCase();
  const sectionText = (section.heading + " " + section.content).toLowerCase();

  // HIGH: direct name match — component name or ID appears in doc text
  if (compName && sectionText.includes(compName)) return "HIGH";
  if (compId && sectionText.includes(compId)) return "HIGH";

  // HIGH: normalized name match (e.g., "place-order" matches "place order")
  const normalizedName = normalizeForMatch(compName);
  const normalizedText = normalizeForMatch(sectionText);
  if (normalizedName.length > 3 && normalizedText.includes(normalizedName)) return "HIGH";

  // MEDIUM: domain + module mentioned together
  if (compDomain && compModule) {
    if (sectionText.includes(compDomain) && sectionText.includes(compModule)) return "MEDIUM";
  }

  // MEDIUM: domain mentioned with partial name overlap
  if (compDomain && sectionText.includes(compDomain)) {
    const nameWords = normalizedName.split(" ").filter((w) => w.length > 3);
    const matchCount = nameWords.filter((w) => normalizedText.includes(w)).length;
    if (matchCount >= 1) return "MEDIUM";
  }

  return "LOW";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  // Validate extract files exist
  if (!existsSync(WORK_DIR)) {
    console.error(`Work directory not found: ${WORK_DIR}`);
    console.error("Ensure Step 3 (Extract) has completed before running trace.");
    process.exit(1);
  }

  const extractFiles = readdirSync(WORK_DIR).filter(
    (f) => f.startsWith("extract-") && f.endsWith(".jsonl")
  );

  if (extractFiles.length === 0) {
    console.error("No extract JSONL files found in .riviere/work/");
    console.error("Ensure Step 3 (Extract) has completed before running trace.");
    process.exit(1);
  }

  // Read components
  const components = readComponents();
  console.log(`Loaded ${components.length} component(s) from ${extractFiles.length} extract file(s).`);

  // Find and parse documentation
  const docFiles = findDocFiles(PROJECT_ROOT);
  console.log(`Found ${docFiles.length} documentation file(s).`);

  const allSections: DocSection[] = [];
  for (const docFile of docFiles) {
    allSections.push(...parseDocSections(docFile));
  }
  console.log(`Parsed ${allSections.length} documentation section(s).`);

  const traceEntries: TraceEntry[] = [];

  // ── Direction 1: Doc-to-code ──
  for (const section of allSections) {
    if (!section.heading || section.content.trim().length < 10) continue;

    const matchedComponents: Array<{ id: string; confidence: "HIGH" | "MEDIUM" }> = [];

    for (const comp of components) {
      const score = scoreMatch(comp, section);
      if (score === "HIGH" || score === "MEDIUM") {
        matchedComponents.push({ id: comp.id ?? comp.name, confidence: score });
      }
    }

    if (matchedComponents.length > 0) {
      // Use the best confidence from matched components
      const bestConfidence = matchedComponents.some((m) => m.confidence === "HIGH")
        ? "HIGH" as const
        : "MEDIUM" as const;

      traceEntries.push({
        feature: section.heading,
        direction: "doc-to-code",
        docSource: `${section.source}:${section.lineStart}-${section.lineEnd}`,
        components: matchedComponents.map((m) => m.id),
        confidence: bestConfidence,
      });
    }
  }

  // ── Direction 2: Code-to-doc ──
  const documentedComponents = new Set(
    traceEntries
      .filter((e) => e.direction === "doc-to-code")
      .flatMap((e) => e.components ?? [])
  );

  for (const comp of components) {
    const compId = comp.id ?? comp.name;

    if (documentedComponents.has(compId)) {
      // Find which doc sections reference this component
      const matchingSources: string[] = [];
      for (const section of allSections) {
        const score = scoreMatch(comp, section);
        if (score === "HIGH" || score === "MEDIUM") {
          matchingSources.push(`${section.source}:${section.lineStart}-${section.lineEnd}`);
        }
      }

      traceEntries.push({
        feature: comp.name ?? compId,
        direction: "code-to-doc",
        component: compId,
        docSources: matchingSources,
        confidence: "HIGH",
      });
    } else {
      // Undocumented component
      traceEntries.push({
        feature: comp.name ?? compId,
        direction: "code-to-doc",
        component: compId,
        docSources: [],
        confidence: "LOW",
        gap: "undocumented",
      });
    }
  }

  // ── Write output ──
  mkdirSync(WORK_DIR, { recursive: true });
  const outputPath = resolve(WORK_DIR, "trace-map.jsonl");
  const outputLines = traceEntries.map((e) => JSON.stringify(e));
  writeFileSync(outputPath, outputLines.join("\n") + "\n", "utf8");

  // ── Summary statistics ──
  const docToCode = traceEntries.filter((e) => e.direction === "doc-to-code");
  const codeToDoc = traceEntries.filter((e) => e.direction === "code-to-doc");
  const highCount = traceEntries.filter((e) => e.confidence === "HIGH").length;
  const mediumCount = traceEntries.filter((e) => e.confidence === "MEDIUM").length;
  const lowCount = traceEntries.filter((e) => e.confidence === "LOW").length;
  const undocumented = traceEntries.filter((e) => e.gap === "undocumented").length;
  const coveragePercent = components.length > 0
    ? Math.round(((components.length - undocumented) / components.length) * 100)
    : 0;

  console.log(`\nTrace Map Summary:`);
  console.log(`  Total entries:       ${traceEntries.length}`);
  console.log(`  Doc-to-code:         ${docToCode.length}`);
  console.log(`  Code-to-doc:         ${codeToDoc.length}`);
  console.log(`  HIGH confidence:     ${highCount}`);
  console.log(`  MEDIUM confidence:   ${mediumCount}`);
  console.log(`  LOW confidence:      ${lowCount}`);
  console.log(`  Undocumented:        ${undocumented} of ${components.length} components`);
  console.log(`  Coverage:            ${coveragePercent}%`);
  console.log(`\nOutput: ${outputPath}`);
}

main();
