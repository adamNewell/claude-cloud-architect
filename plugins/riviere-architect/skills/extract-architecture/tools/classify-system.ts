#!/usr/bin/env bun
/**
 * classify-system — determine system type, complexity, and recommended lenses
 *
 * Runs before Explore (Step 0). Examines IaC files, package manifests,
 * directory structure, orchestration markers, and communication patterns
 * to produce a classification that drives lens activation and agent counts.
 *
 * Output: .riviere/config/classification.json
 *
 * Usage:
 *   bun classify-system.ts --project-root /path/to/project <repo-path> [repo-path...]
 *   bun classify-system.ts --help
 *
 * Exit codes:
 *   0 — success
 *   1 — invalid usage
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, basename, join } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
classify-system — determine system type, complexity, and recommended lenses

Runs as Step 0 of the riviere-architect pipeline. Examines repository
structure, IaC files, package manifests, and communication patterns to
classify the system and recommend extraction lenses.

USAGE
  bun classify-system.ts --project-root <dir> <repo-path> [repo-path...]

OPTIONS
  --project-root <dir>   Resolve .riviere/ relative to this directory (required)
  --help, -h             Show this message

OUTPUT
  .riviere/config/classification.json

EXAMPLES
  bun classify-system.ts --project-root /project /project/orders-service
  bun classify-system.ts --project-root /project /project/api /project/worker /project/frontend
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const projectRootIdx = args.indexOf("--project-root");
if (projectRootIdx === -1 || !args[projectRootIdx + 1]) {
  console.error("Error: --project-root is required.");
  process.exit(1);
}
const PROJECT_ROOT = resolve(args[projectRootIdx + 1]);

// Collect repo paths (positional args that aren't flags)
const flagIndices = new Set<number>();
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project-root") {
    flagIndices.add(i);
    flagIndices.add(i + 1);
  }
}
const repoPaths = args.filter((_, i) => !flagIndices.has(i)).map((p) => resolve(p));

if (repoPaths.length === 0) {
  console.error("Error: At least one repo path is required.");
  process.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Orchestration {
  detected: boolean;
  engines: Array<{ type: string; evidence: string; count: number }>;
}

interface Characteristics {
  architecture: string;
  communicationPattern: string;
  deploymentModel: string;
  orchestration: Orchestration;
  dataPattern: string;
  apiStyle: string;
  messagingProtocol: string[];
  languages: string[];
  monorepo: boolean;
  repoCount: number;
}

interface EntryPointHint {
  type: string;
  engine?: string;
  location: string;
  priority: "high" | "medium" | "low";
}

interface Classification {
  version: string;
  systemType: string;
  systemTypeConfidence: "HIGH" | "MEDIUM" | "LOW";
  characteristics: Characteristics;
  recommendedLenses: string[];
  complexityEstimate: {
    scale: "small" | "medium" | "large" | "massive";
    estimatedComponents: { min: number; max: number };
    estimatedDomains: { min: number; max: number };
    recommendedAgentCount: Record<string, number>;
    estimatedDuration: string;
  };
  entryPointHints: EntryPointHint[];
}

// ─── Detection Helpers ────────────────────────────────────────────────────────

function fileExists(dir: string, ...names: string[]): boolean {
  return names.some((n) => existsSync(resolve(dir, n)));
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function collectFiles(dir: string, extensions: string[], maxDepth = 4, depth = 0): string[] {
  if (depth > maxDepth || !existsSync(dir)) return [];
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build") continue;
      const full = resolve(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...collectFiles(full, extensions, maxDepth, depth + 1));
        } else if (extensions.some((ext) => entry.endsWith(ext))) {
          results.push(full);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

function grepCount(dir: string, pattern: RegExp, extensions: string[]): number {
  let count = 0;
  const files = collectFiles(dir, extensions);
  for (const file of files) {
    const content = readFileSafe(file);
    const matches = content.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function grepLocations(dir: string, pattern: RegExp, extensions: string[]): Array<{ file: string; line: number }> {
  const results: Array<{ file: string; line: number }> = [];
  const files = collectFiles(dir, extensions);
  for (const file of files) {
    const lines = readFileSafe(file).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({ file: file.replace(PROJECT_ROOT + "/", ""), line: i + 1 });
      }
    }
  }
  return results;
}

// ─── Package Manifest Analysis ────────────────────────────────────────────────

interface PackageInfo {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function readPackageJson(repoRoot: string): PackageInfo | null {
  const pkgPath = resolve(repoRoot, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return {
      name: pkg.name ?? basename(repoRoot),
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {},
    };
  } catch {
    return null;
  }
}

function hasDep(pkg: PackageInfo, ...names: string[]): boolean {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  return names.some((n) => n in allDeps);
}

// ─── Framework Detection ──────────────────────────────────────────────────────

function detectFrameworks(repoPaths: string[]): { web: string[]; messaging: string[]; db: string[]; iac: string[] } {
  const web = new Set<string>();
  const messaging = new Set<string>();
  const db = new Set<string>();
  const iac = new Set<string>();

  for (const repoRoot of repoPaths) {
    const pkg = readPackageJson(repoRoot);

    // IaC
    if (fileExists(repoRoot, "cdk.json", "cdk.context.json")) iac.add("cdk");
    if (collectFiles(repoRoot, [".tf"], 2).length > 0) iac.add("terraform");
    if (fileExists(repoRoot, "template.yaml", "template.yml", "sam-template.yaml")) iac.add("cloudformation");
    if (fileExists(repoRoot, "Pulumi.yaml", "Pulumi.yml")) iac.add("pulumi");
    if (fileExists(repoRoot, "serverless.yml", "serverless.yaml")) iac.add("serverless");

    if (!pkg) continue;

    // Web frameworks
    if (hasDep(pkg, "@nestjs/core")) web.add("NestJS");
    if (hasDep(pkg, "express")) web.add("Express");
    if (hasDep(pkg, "fastify")) web.add("Fastify");
    if (hasDep(pkg, "next")) web.add("Next.js");
    if (hasDep(pkg, "react") && !hasDep(pkg, "next")) web.add("React");
    if (hasDep(pkg, "@angular/core")) web.add("Angular");
    if (hasDep(pkg, "vue")) web.add("Vue");
    if (hasDep(pkg, "hono")) web.add("Hono");
    if (hasDep(pkg, "koa")) web.add("Koa");

    // Messaging
    if (hasDep(pkg, "mqtt", "aedes")) messaging.add("mqtt");
    if (hasDep(pkg, "@aws-sdk/client-sqs", "sqs-consumer")) messaging.add("sqs");
    if (hasDep(pkg, "@aws-sdk/client-sns")) messaging.add("sns");
    if (hasDep(pkg, "kafkajs", "@confluentinc/kafka-javascript")) messaging.add("kafka");
    if (hasDep(pkg, "amqplib", "amqp-connection-manager")) messaging.add("amqp");
    if (hasDep(pkg, "@nestjs/microservices")) messaging.add("nestjs-microservices");
    if (hasDep(pkg, "bullmq", "bull")) messaging.add("bullmq");
    if (hasDep(pkg, "@aws-sdk/client-eventbridge")) messaging.add("eventbridge");

    // Database
    if (hasDep(pkg, "typeorm")) db.add("TypeORM");
    if (hasDep(pkg, "prisma", "@prisma/client")) db.add("Prisma");
    if (hasDep(pkg, "sequelize")) db.add("Sequelize");
    if (hasDep(pkg, "mongoose")) db.add("Mongoose");
    if (hasDep(pkg, "@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb")) db.add("DynamoDB");
    if (hasDep(pkg, "knex")) db.add("Knex");
    if (hasDep(pkg, "drizzle-orm")) db.add("Drizzle");
  }

  return { web: [...web], messaging: [...messaging], db: [...db], iac: [...iac] };
}

// ─── Language Detection ───────────────────────────────────────────────────────

function detectLanguages(repoPaths: string[]): string[] {
  const langs = new Set<string>();
  for (const repoRoot of repoPaths) {
    if (fileExists(repoRoot, "tsconfig.json", "tsconfig.base.json")) langs.add("typescript");
    if (fileExists(repoRoot, "package.json") && !fileExists(repoRoot, "tsconfig.json")) langs.add("javascript");
    if (fileExists(repoRoot, "pom.xml", "build.gradle", "build.gradle.kts")) langs.add("java");
    if (fileExists(repoRoot, "requirements.txt", "pyproject.toml", "setup.py")) langs.add("python");
    if (fileExists(repoRoot, "go.mod")) langs.add("go");
    if (fileExists(repoRoot, "Cargo.toml")) langs.add("rust");
    if (fileExists(repoRoot, "*.csproj", "*.sln")) langs.add("csharp");
  }
  return [...langs];
}

// ─── Orchestration Detection ──────────────────────────────────────────────────

function detectOrchestration(repoPaths: string[]): Orchestration {
  const engines: Array<{ type: string; evidence: string; count: number }> = [];

  for (const repoRoot of repoPaths) {
    // Step Functions (CDK)
    const sfnLocs = grepLocations(repoRoot, /new\s+(?:sfn\.)?StateMachine|StepFunction|StateMachineProps/g, [".ts", ".js"]);
    if (sfnLocs.length > 0) {
      engines.push({ type: "step-functions", evidence: `${sfnLocs[0].file}:${sfnLocs[0].line}`, count: sfnLocs.length });
    }

    // Step Functions (CloudFormation)
    const cfnSfn = grepLocations(repoRoot, /AWS::StepFunctions::StateMachine/g, [".yaml", ".yml", ".json"]);
    if (cfnSfn.length > 0 && !engines.some((e) => e.type === "step-functions")) {
      engines.push({ type: "step-functions", evidence: `${cfnSfn[0].file}:${cfnSfn[0].line}`, count: cfnSfn.length });
    }

    // Temporal
    const temporalLocs = grepLocations(repoRoot, /temporal|@temporalio/g, [".ts", ".js"]);
    if (temporalLocs.length > 0) {
      engines.push({ type: "temporal", evidence: `${temporalLocs[0].file}:${temporalLocs[0].line}`, count: temporalLocs.length });
    }

    // Saga / Process Manager patterns
    const sagaLocs = grepLocations(repoRoot, /class\s+\w+Saga|class\s+\w+ProcessManager|@Saga/g, [".ts", ".js"]);
    if (sagaLocs.length > 0) {
      engines.push({ type: "saga-pattern", evidence: `${sagaLocs[0].file}:${sagaLocs[0].line}`, count: sagaLocs.length });
    }

    // Airflow
    const airflowLocs = grepLocations(repoRoot, /from\s+airflow|DAG\s*\(/g, [".py"]);
    if (airflowLocs.length > 0) {
      engines.push({ type: "airflow", evidence: `${airflowLocs[0].file}:${airflowLocs[0].line}`, count: airflowLocs.length });
    }
  }

  return { detected: engines.length > 0, engines };
}

// ─── Architecture Classification ──────────────────────────────────────────────

function classifyArchitecture(
  repoCount: number,
  frameworks: ReturnType<typeof detectFrameworks>,
  orchestration: Orchestration,
): { architecture: string; communicationPattern: string; deploymentModel: string; dataPattern: string; apiStyle: string } {
  // Architecture
  let architecture = "monolith";
  if (repoCount > 2) architecture = "microservices";
  else if (repoCount === 2) architecture = "modular-monolith";

  // Communication pattern
  let communicationPattern = "synchronous";
  if (frameworks.messaging.length > 0) {
    communicationPattern = "event-driven";
  }

  // Deployment model
  let deploymentModel = "traditional";
  if (frameworks.iac.includes("cdk") || frameworks.iac.includes("cloudformation") || frameworks.iac.includes("pulumi")) {
    deploymentModel = "containerized";
  }
  if (frameworks.iac.includes("serverless")) {
    deploymentModel = "serverless";
  }

  // Data pattern
  let dataPattern = "crud";
  // Check for CQRS indicators
  const hasCqrs = repoPaths.some((r) => {
    const content = collectFiles(r, [".ts", ".js"], 3)
      .slice(0, 50)
      .map((f) => readFileSafe(f))
      .join("\n");
    return /cqrs|CommandHandler|QueryHandler|CommandBus|QueryBus/i.test(content);
  });
  if (hasCqrs) dataPattern = "cqrs";

  // API style
  let apiStyle = "rest";
  const hasGraphql = repoPaths.some((r) => {
    const pkg = readPackageJson(r);
    return pkg && hasDep(pkg, "graphql", "@apollo/server", "type-graphql");
  });
  if (hasGraphql) apiStyle = "graphql";
  const hasGrpc = repoPaths.some((r) => {
    const pkg = readPackageJson(r);
    return pkg && hasDep(pkg, "@grpc/grpc-js", "grpc");
  });
  if (hasGrpc) apiStyle = "grpc";

  return { architecture, communicationPattern, deploymentModel, dataPattern, apiStyle };
}

// ─── Monorepo Detection ───────────────────────────────────────────────────────

function isMonorepo(repoPaths: string[]): boolean {
  if (repoPaths.length !== 1) return false;
  const root = repoPaths[0];
  // Check for common monorepo markers
  return fileExists(root, "lerna.json", "nx.json", "turbo.json", "pnpm-workspace.yaml")
    || (existsSync(resolve(root, "package.json")) && existsSync(resolve(root, "packages")));
}

// ─── Complexity Estimation ────────────────────────────────────────────────────

function estimateComplexity(
  repoCount: number,
  characteristics: Characteristics,
): Classification["complexityEstimate"] {
  let scale: "small" | "medium" | "large" | "massive" = "small";
  let minComponents = 20;
  let maxComponents = 50;
  let minDomains = 1;
  let maxDomains = 3;

  if (repoCount <= 1) {
    scale = "small";
    minComponents = 20; maxComponents = 80;
    minDomains = 1; maxDomains = 4;
  } else if (repoCount <= 4) {
    scale = "medium";
    minComponents = 80; maxComponents = 200;
    minDomains = 3; maxDomains = 8;
  } else if (repoCount <= 10) {
    scale = "large";
    minComponents = 200; maxComponents = 500;
    minDomains = 5; maxDomains = 15;
  } else {
    scale = "massive";
    minComponents = 500; maxComponents = 2000;
    minDomains = 10; maxDomains = 50;
  }

  // Adjust for async complexity
  if (characteristics.communicationPattern === "event-driven") {
    minComponents = Math.round(minComponents * 1.5);
    maxComponents = Math.round(maxComponents * 1.5);
  }

  const agentBase = Math.max(1, repoCount);
  const recommendedAgentCount: Record<string, number> = {
    explore: agentBase,
    configure: agentBase * 6, // 6 component types per repo
    extract: agentBase,
    connect: agentBase,
    annotate: agentBase,
  };

  const durations: Record<string, string> = {
    small: "15-30 minutes",
    medium: "45-90 minutes",
    large: "90-180 minutes",
    massive: "3-8 hours",
  };

  return {
    scale,
    estimatedComponents: { min: minComponents, max: maxComponents },
    estimatedDomains: { min: minDomains, max: maxDomains },
    recommendedAgentCount,
    estimatedDuration: durations[scale],
  };
}

// ─── Lens Recommendation ──────────────────────────────────────────────────────

function recommendLenses(characteristics: Characteristics): string[] {
  const lenses: string[] = [];

  // Always active
  lenses.push("api-surface");
  lenses.push("data-access");
  lenses.push("domain-logic");

  // Conditional
  if (characteristics.communicationPattern === "event-driven" || characteristics.messagingProtocol.length > 0) {
    lenses.push("event-flow");
  }

  if (characteristics.orchestration.detected) {
    lenses.push("orchestration");
  }

  if (characteristics.repoCount > 1) {
    lenses.push("integration");
  }

  return lenses;
}

// ─── Entry Point Detection ────────────────────────────────────────────────────

function detectEntryPoints(repoPaths: string[], orchestration: Orchestration): EntryPointHint[] {
  const hints: EntryPointHint[] = [];

  // Orchestration entry points
  for (const engine of orchestration.engines) {
    hints.push({
      type: "orchestration",
      engine: engine.type,
      location: engine.evidence,
      priority: "high",
    });
  }

  // API gateway / router entry points
  for (const repoRoot of repoPaths) {
    // Look for API gateway in IaC
    const apiGwLocs = grepLocations(repoRoot, /RestApi|HttpApi|ApiGateway|api-gateway/g, [".ts", ".js", ".yaml", ".yml"]);
    if (apiGwLocs.length > 0) {
      hints.push({
        type: "api-gateway",
        location: `${apiGwLocs[0].file}:${apiGwLocs[0].line}`,
        priority: "high",
      });
    }

    // Main entry points
    const mainLocs = grepLocations(repoRoot, /NestFactory\.create|app\.listen|createServer/g, [".ts", ".js"]);
    if (mainLocs.length > 0) {
      hints.push({
        type: "application-bootstrap",
        location: `${mainLocs[0].file}:${mainLocs[0].line}`,
        priority: "medium",
      });
    }
  }

  return hints;
}

// ─── System Type Inference ────────────────────────────────────────────────────

function inferSystemType(characteristics: Characteristics): { type: string; confidence: "HIGH" | "MEDIUM" | "LOW" } {
  const { architecture, communicationPattern, orchestration } = characteristics;

  if (architecture === "microservices" && communicationPattern === "event-driven") {
    return { type: "event-driven-microservices", confidence: "HIGH" };
  }
  if (architecture === "microservices" && communicationPattern === "synchronous") {
    return { type: "synchronous-microservices", confidence: "HIGH" };
  }
  if (architecture === "monolith" && communicationPattern === "event-driven") {
    return { type: "modular-monolith-with-events", confidence: "MEDIUM" };
  }
  if (architecture === "modular-monolith") {
    return { type: "modular-monolith", confidence: "MEDIUM" };
  }
  if (orchestration.detected) {
    return { type: "orchestrated-workflows", confidence: "MEDIUM" };
  }
  if (architecture === "monolith") {
    return { type: "monolith", confidence: "HIGH" };
  }

  return { type: "unknown", confidence: "LOW" };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("Classifying system...\n");
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Repositories: ${repoPaths.length}`);
for (const r of repoPaths) {
  console.log(`  ${basename(r)}: ${r}`);
}

const frameworks = detectFrameworks(repoPaths);
console.log(`\nFrameworks detected:`);
console.log(`  Web: ${frameworks.web.join(", ") || "none"}`);
console.log(`  Messaging: ${frameworks.messaging.join(", ") || "none"}`);
console.log(`  Database: ${frameworks.db.join(", ") || "none"}`);
console.log(`  IaC: ${frameworks.iac.join(", ") || "none"}`);

const orchestration = detectOrchestration(repoPaths);
if (orchestration.detected) {
  console.log(`\nOrchestration detected:`);
  for (const e of orchestration.engines) {
    console.log(`  ${e.type}: ${e.count} instance(s) — ${e.evidence}`);
  }
}

const languages = detectLanguages(repoPaths);
const monorepo = isMonorepo(repoPaths);
const archClassification = classifyArchitecture(repoPaths.length, frameworks, orchestration);

const characteristics: Characteristics = {
  ...archClassification,
  orchestration,
  messagingProtocol: frameworks.messaging,
  languages,
  monorepo,
  repoCount: repoPaths.length,
};

const { type: systemType, confidence: systemTypeConfidence } = inferSystemType(characteristics);
const recommendedLenses = recommendLenses(characteristics);
const complexityEstimate = estimateComplexity(repoPaths.length, characteristics);
const entryPointHints = detectEntryPoints(repoPaths, orchestration);

const classification: Classification = {
  version: "1.0",
  systemType,
  systemTypeConfidence,
  characteristics,
  recommendedLenses,
  complexityEstimate,
  entryPointHints,
};

// Write output
const CONFIG_DIR = resolve(PROJECT_ROOT, ".riviere", "config");
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

const outputPath = resolve(CONFIG_DIR, "classification.json");
writeFileSync(outputPath, JSON.stringify(classification, null, 2) + "\n", "utf8");

// Summary
console.log(`\n${"═".repeat(50)}`);
console.log(`  SYSTEM CLASSIFICATION`);
console.log(`${"═".repeat(50)}`);
console.log(`  Type:         ${systemType} (${systemTypeConfidence})`);
console.log(`  Architecture: ${characteristics.architecture}`);
console.log(`  Comms:        ${characteristics.communicationPattern}`);
console.log(`  Deployment:   ${characteristics.deploymentModel}`);
console.log(`  Data:         ${characteristics.dataPattern}`);
console.log(`  API:          ${characteristics.apiStyle}`);
console.log(`  Lenses:       ${recommendedLenses.join(", ")}`);
console.log(`  Scale:        ${complexityEstimate.scale}`);
console.log(`  Components:   ${complexityEstimate.estimatedComponents.min}-${complexityEstimate.estimatedComponents.max}`);
console.log(`  Duration:     ${complexityEstimate.estimatedDuration}`);
console.log(`${"═".repeat(50)}`);
console.log(`\nOutput: ${outputPath}`);
