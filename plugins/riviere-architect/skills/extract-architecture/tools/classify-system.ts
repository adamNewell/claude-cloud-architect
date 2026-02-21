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

/**
 * A deployment signal is a concrete file-based indicator that a specific
 * compute model is in use. Each signal records its kind and the exact
 * file/pattern that triggered it — enabling the deployment model decision
 * to be auditable and deterministic.
 *
 * Kinds:
 *   container          — Dockerfile or docker-compose present
 *   ecs-fargate        — ECS TaskDefinition or FargateService in CDK/CFN
 *   lambda             — Lambda Function in CDK, CFN/SAM, or handler export
 *   serverless-framework — serverless.yml/yaml present (Serverless Framework)
 */
interface DeploymentSignal {
  kind: "container" | "ecs-fargate" | "lambda" | "serverless-framework";
  evidence: string;
}

interface Characteristics {
  architecture: string;
  architectureEvidence: string[];
  communicationPattern: string;
  deploymentModel: string;
  deploymentEvidence: string[];
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

// ─── Deployment Signal Detection ──────────────────────────────────────────────
//
// Deployment signals are CONCRETE file-based evidence for a specific compute model.
// Each signal records what it found and where, making the deployment classification
// fully auditable. The decision tree below uses these signals exclusively.
//
// Signal kinds:
//   container           Dockerfile or docker-compose (explicit containerization)
//   ecs-fargate         ECS TaskDefinition/FargateService in CDK or CloudFormation
//   lambda              Lambda Function in CDK, CloudFormation/SAM, or handler export
//   serverless-framework serverless.yml/yaml (Serverless Framework project)
//
// Decision rules (applied after signal collection):
//   RULE 1: containers present  AND  lambda present  →  "hybrid"
//   RULE 2: containers present  AND  no lambda       →  "containerized"
//   RULE 3: lambda present      AND  no containers   →  "serverless"
//   RULE 4: no containers, no lambda, IaC present    →  "cloud-managed"
//   RULE 5: no containers, no lambda, no IaC         →  "traditional"
//
// "containers present" = any signal with kind "container" or "ecs-fargate"
// "lambda present"     = any signal with kind "lambda" or "serverless-framework"

function detectDeploymentSignals(repoPaths: string[]): DeploymentSignal[] {
  const signals: DeploymentSignal[] = [];

  for (const repoRoot of repoPaths) {
    const repoName = basename(repoRoot);

    // ── Container signals ────────────────────────────────────────────────────
    // Dockerfile at any name variant
    for (const df of ["Dockerfile", "dockerfile", "Dockerfile.prod", "Dockerfile.dev", "Dockerfile.staging"]) {
      if (existsSync(resolve(repoRoot, df))) {
        signals.push({ kind: "container", evidence: `${repoName}/${df}` });
      }
    }
    // docker-compose
    if (fileExists(repoRoot, "docker-compose.yml", "docker-compose.yaml")) {
      signals.push({ kind: "container", evidence: `${repoName}/docker-compose.yml` });
    }
    // Dockerfile nested in subdirectories (services with own Dockerfiles)
    const nestedDockerfiles = collectFiles(repoRoot, ["Dockerfile"], 3);
    for (const df of nestedDockerfiles) {
      if (!df.includes("node_modules")) {
        signals.push({ kind: "container", evidence: df.replace(PROJECT_ROOT + "/", "") });
      }
    }

    // ── ECS/Fargate signals (CDK) ────────────────────────────────────────────
    const ecsCdkPattern = /new\s+(?:ecs\.|aws_ecs\.)(?:TaskDefinition|FargateTaskDefinition|Ec2TaskDefinition|FargateService|Ec2Service)|ContainerImage\.(?:fromAsset|fromRegistry|fromEcrRepository)|FargateTaskDefinition|EcsPattern/g;
    const ecsCdkLocs = grepLocations(repoRoot, ecsCdkPattern, [".ts", ".js"]);
    if (ecsCdkLocs.length > 0) {
      signals.push({ kind: "ecs-fargate", evidence: `${ecsCdkLocs[0].file}:${ecsCdkLocs[0].line} (${ecsCdkLocs.length} reference${ecsCdkLocs.length > 1 ? "s" : ""})` });
    }
    // ECS/Fargate in CloudFormation
    const ecsCfnLocs = grepLocations(repoRoot, /AWS::ECS::TaskDefinition|AWS::ECS::Service|AWS::ECS::Cluster/g, [".yaml", ".yml", ".json"]);
    if (ecsCfnLocs.length > 0) {
      signals.push({ kind: "ecs-fargate", evidence: `${ecsCfnLocs[0].file}:${ecsCfnLocs[0].line} (CFN)` });
    }

    // ── Lambda signals (CDK) ─────────────────────────────────────────────────
    const lambdaCdkPattern = /new\s+(?:lambda\.|aws_lambda\.|NodejsFunction|PythonFunction|GoFunction|RustFunction|DockerImageFunction)(?:Function|Code)?[\s\(]|new\s+NodejsFunction\b|new\s+PythonFunction\b|lambda\.Function\b|aws_lambda\.Function\b/g;
    const lambdaCdkLocs = grepLocations(repoRoot, lambdaCdkPattern, [".ts", ".js"]);
    if (lambdaCdkLocs.length > 0) {
      signals.push({ kind: "lambda", evidence: `${lambdaCdkLocs[0].file}:${lambdaCdkLocs[0].line} (${lambdaCdkLocs.length} Lambda construct${lambdaCdkLocs.length > 1 ? "s" : ""})` });
    }

    // ── Lambda signals (CloudFormation/SAM) ──────────────────────────────────
    const lambdaCfnLocs = grepLocations(repoRoot, /AWS::Lambda::Function|AWS::Serverless::Function/g, [".yaml", ".yml", ".json"]);
    if (lambdaCfnLocs.length > 0) {
      signals.push({ kind: "lambda", evidence: `${lambdaCfnLocs[0].file}:${lambdaCfnLocs[0].line} (${lambdaCfnLocs.length} CFN resource${lambdaCfnLocs.length > 1 ? "s" : ""})` });
    }

    // ── Lambda signals (handler exports in source files) ─────────────────────
    // Files exporting `handler` are Lambda entry points
    const handlerExportPattern = /exports\.handler\s*=|module\.exports\.handler\s*=|export\s+(?:const|async function)\s+handler\s*[=\(]/g;
    const handlerLocs = grepLocations(repoRoot, handlerExportPattern, [".ts", ".js"]);
    if (handlerLocs.length > 0) {
      signals.push({ kind: "lambda", evidence: `${handlerLocs[0].file}:${handlerLocs[0].line} (${handlerLocs.length} handler export${handlerLocs.length > 1 ? "s" : ""})` });
    }

    // ── Serverless Framework ─────────────────────────────────────────────────
    if (fileExists(repoRoot, "serverless.yml", "serverless.yaml")) {
      signals.push({ kind: "serverless-framework", evidence: `${repoName}/serverless.yml` });
    }
  }

  return signals;
}

// ─── Deployment Model Classification ─────────────────────────────────────────
//
// Applies the 5-rule decision tree against detected signals.
// Returns a human-readable model name and the evidence list.

function classifyDeploymentModel(
  signals: DeploymentSignal[],
  iacDetected: boolean,
): { deploymentModel: string; deploymentEvidence: string[] } {
  const containerSignals = signals.filter((s) => s.kind === "container" || s.kind === "ecs-fargate");
  const lambdaSignals = signals.filter((s) => s.kind === "lambda" || s.kind === "serverless-framework");
  const evidence = signals.map((s) => `[${s.kind}] ${s.evidence}`);

  // RULE 1: both containers and lambda present → hybrid
  if (containerSignals.length > 0 && lambdaSignals.length > 0) {
    return { deploymentModel: "hybrid", deploymentEvidence: evidence };
  }
  // RULE 2: only containers (no lambda)
  if (containerSignals.length > 0) {
    return { deploymentModel: "containerized", deploymentEvidence: evidence };
  }
  // RULE 3: only lambda (no containers)
  if (lambdaSignals.length > 0) {
    return { deploymentModel: "serverless", deploymentEvidence: evidence };
  }
  // RULE 4: IaC present but no specific compute detected
  if (iacDetected) {
    return { deploymentModel: "cloud-managed", deploymentEvidence: ["IaC detected but no container or Lambda signals found"] };
  }
  // RULE 5: no IaC, no containers, no lambda
  return { deploymentModel: "traditional", deploymentEvidence: ["no IaC, container, or Lambda signals found"] };
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
//
// Architecture is determined by independently-deployable unit count, not just
// repo count. A monorepo with 5 packages all in one container is still a
// modular-monolith. Each separately-deployable unit (distinct Dockerfile or
// Lambda handler set in a different path) is counted as one service boundary.
//
// Rules:
//   deployableUnits >= 3  →  microservices
//   deployableUnits === 2  →  modular-monolith
//   deployableUnits === 1  →  monolith
//
// If deployable units cannot be determined from signals, falls back to repo count.

function countDeployableUnits(repoPaths: string[], deploymentSignals: DeploymentSignal[]): {
  count: number;
  evidence: string[];
} {
  const units = new Set<string>();
  const evidence: string[] = [];

  // Each distinct Dockerfile path = one deployable unit
  const dockerfileSignals = deploymentSignals.filter((s) => s.kind === "container" && s.evidence.includes("Dockerfile"));
  for (const s of dockerfileSignals) {
    // Group by directory to avoid counting Dockerfile + Dockerfile.prod as two units
    const dir = s.evidence.split("/").slice(0, -1).join("/") || s.evidence;
    if (!units.has(dir)) {
      units.add(dir);
      evidence.push(`container at ${s.evidence}`);
    }
  }

  // Each repo with ECS signals = one deployable unit
  const ecsSignals = deploymentSignals.filter((s) => s.kind === "ecs-fargate");
  if (ecsSignals.length > 0 && units.size === 0) {
    for (const repoRoot of repoPaths) {
      const key = `ecs:${basename(repoRoot)}`;
      if (!units.has(key)) {
        units.add(key);
        evidence.push(`ECS service in ${basename(repoRoot)}`);
      }
    }
  }

  // Each distinct handler-export cluster (by top-level directory) = one Lambda unit
  const lambdaHandlerSignals = deploymentSignals.filter((s) => s.kind === "lambda" && s.evidence.includes("handler export"));
  if (lambdaHandlerSignals.length > 0) {
    // Count as one lambda unit per repo that has handlers
    for (const repoRoot of repoPaths) {
      const key = `lambda:${basename(repoRoot)}`;
      if (!units.has(key)) {
        units.add(key);
        evidence.push(`Lambda handlers in ${basename(repoRoot)}`);
      }
    }
  }

  // If no unit evidence found, fall back to repo count
  if (units.size === 0) {
    for (const repoRoot of repoPaths) {
      const key = `repo:${basename(repoRoot)}`;
      units.add(key);
      evidence.push(`repo ${basename(repoRoot)} (fallback)`);
    }
  }

  return { count: units.size, evidence };
}

function classifyArchitecture(
  repoPaths: string[],
  deploymentSignals: DeploymentSignal[],
  frameworks: ReturnType<typeof detectFrameworks>,
  orchestration: Orchestration,
): {
  architecture: string;
  architectureEvidence: string[];
  communicationPattern: string;
  dataPattern: string;
  apiStyle: string;
} {
  // ── Architecture ────────────────────────────────────────────────────────────
  // Count independently-deployable units, not just repos
  const { count: deployableUnits, evidence: archEvidence } = countDeployableUnits(repoPaths, deploymentSignals);

  let architecture: string;
  if (deployableUnits >= 3) {
    architecture = "microservices";
  } else if (deployableUnits === 2) {
    architecture = "modular-monolith";
  } else {
    architecture = "monolith";
  }
  const architectureEvidence = [`${deployableUnits} independently-deployable unit(s)`, ...archEvidence];

  // ── Communication pattern ───────────────────────────────────────────────────
  let communicationPattern = "synchronous";
  if (frameworks.messaging.length > 0) {
    communicationPattern = "event-driven";
  }

  // ── Data pattern ─────────────────────────────────────────────────────────────
  let dataPattern = "crud";
  const hasCqrs = repoPaths.some((r) => {
    const content = collectFiles(r, [".ts", ".js"], 3)
      .slice(0, 50)
      .map((f) => readFileSafe(f))
      .join("\n");
    return /cqrs|CommandHandler|QueryHandler|CommandBus|QueryBus/i.test(content);
  });
  if (hasCqrs) dataPattern = "cqrs";

  // ── API style ─────────────────────────────────────────────────────────────
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

  return { architecture, architectureEvidence, communicationPattern, dataPattern, apiStyle };
}

// ─── Monorepo Detection ───────────────────────────────────────────────────────

function isMonorepo(repoPaths: string[]): boolean {
  if (repoPaths.length !== 1) return false;
  const root = repoPaths[0];
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

  if (characteristics.communicationPattern === "event-driven") {
    minComponents = Math.round(minComponents * 1.5);
    maxComponents = Math.round(maxComponents * 1.5);
  }

  const agentBase = Math.max(1, repoCount);
  const recommendedAgentCount: Record<string, number> = {
    explore: agentBase,
    configure: agentBase * 6,
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

  lenses.push("api-surface");
  lenses.push("data-access");
  lenses.push("domain-logic");

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

  for (const engine of orchestration.engines) {
    hints.push({
      type: "orchestration",
      engine: engine.type,
      location: engine.evidence,
      priority: "high",
    });
  }

  for (const repoRoot of repoPaths) {
    const apiGwLocs = grepLocations(repoRoot, /RestApi|HttpApi|ApiGateway|api-gateway/g, [".ts", ".js", ".yaml", ".yml"]);
    if (apiGwLocs.length > 0) {
      hints.push({
        type: "api-gateway",
        location: `${apiGwLocs[0].file}:${apiGwLocs[0].line}`,
        priority: "high",
      });
    }

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
  const { architecture, communicationPattern, orchestration, deploymentModel } = characteristics;

  if (architecture === "microservices" && communicationPattern === "event-driven") {
    return { type: "event-driven-microservices", confidence: "HIGH" };
  }
  if (architecture === "microservices" && communicationPattern === "synchronous") {
    return { type: "synchronous-microservices", confidence: "HIGH" };
  }
  if (deploymentModel === "hybrid") {
    return { type: "hybrid-cloud-system", confidence: "HIGH" };
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

// ── Deployment signal detection ──────────────────────────────────────────────
const deploymentSignals = detectDeploymentSignals(repoPaths);
const iacDetected = frameworks.iac.length > 0;
const { deploymentModel, deploymentEvidence } = classifyDeploymentModel(deploymentSignals, iacDetected);

console.log(`\nDeployment signals (${deploymentSignals.length} found):`);
if (deploymentSignals.length === 0) {
  console.log(`  none`);
} else {
  for (const s of deploymentSignals) {
    console.log(`  [${s.kind}] ${s.evidence}`);
  }
}
console.log(`  → deployment model: ${deploymentModel}`);

// ── Architecture + remaining characteristics ──────────────────────────────────
const languages = detectLanguages(repoPaths);
const monorepo = isMonorepo(repoPaths);
const archResult = classifyArchitecture(repoPaths, deploymentSignals, frameworks, orchestration);

const characteristics: Characteristics = {
  architecture: archResult.architecture,
  architectureEvidence: archResult.architectureEvidence,
  communicationPattern: archResult.communicationPattern,
  deploymentModel,
  deploymentEvidence,
  orchestration,
  dataPattern: archResult.dataPattern,
  apiStyle: archResult.apiStyle,
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
  version: "1.1",
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
console.log(`\n${"═".repeat(60)}`);
console.log(`  SYSTEM CLASSIFICATION`);
console.log(`${"═".repeat(60)}`);
console.log(`  Type:         ${systemType} (${systemTypeConfidence})`);
console.log(`  Architecture: ${characteristics.architecture}`);
console.log(`                ${characteristics.architectureEvidence[0]}`);
console.log(`  Comms:        ${characteristics.communicationPattern}`);
console.log(`  Deployment:   ${characteristics.deploymentModel}`);
if (deploymentEvidence.length > 0) {
  console.log(`                Evidence (${deploymentEvidence.length} signal${deploymentEvidence.length > 1 ? "s" : ""}):`);
  for (const ev of deploymentEvidence.slice(0, 4)) {
    console.log(`                  ${ev}`);
  }
  if (deploymentEvidence.length > 4) {
    console.log(`                  ... and ${deploymentEvidence.length - 4} more`);
  }
}
console.log(`  Data:         ${characteristics.dataPattern}`);
console.log(`  API:          ${characteristics.apiStyle}`);
console.log(`  Lenses:       ${recommendedLenses.join(", ")}`);
console.log(`  Scale:        ${complexityEstimate.scale}`);
console.log(`  Components:   ${complexityEstimate.estimatedComponents.min}-${complexityEstimate.estimatedComponents.max}`);
console.log(`  Duration:     ${complexityEstimate.estimatedDuration}`);
console.log(`${"═".repeat(60)}`);
console.log(`\nOutput: ${outputPath}`);
