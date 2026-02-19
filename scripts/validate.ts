#!/usr/bin/env bun
/**
 * validate.ts — validate all plugins in this marketplace
 *
 * Usage:
 *   bun scripts/validate.ts              # validate all plugins
 *   bun scripts/validate.ts mcp-plugin   # validate one plugin
 */

import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";

const PLUGINS_DIR = resolve(import.meta.dir, "../plugins");
const MARKETPLACE_MANIFEST = resolve(import.meta.dir, "../.claude-plugin/marketplace.json");

interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  author?: { name: string; email?: string; url?: string };
  license?: string;
  keywords?: string[];
}

interface MarketplaceManifest {
  name: string;
  owner: { name: string };
  plugins: Array<{ name: string; source: string }>;
}

type ValidationResult = { plugin: string; pass: boolean; errors: string[]; warnings: string[] };

async function validatePlugin(pluginDir: string): Promise<ValidationResult> {
  const name = pluginDir.split("/").pop()!;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for .claude-plugin/plugin.json
  const manifestPath = join(pluginDir, ".claude-plugin/plugin.json");
  let manifest: PluginManifest | null = null;
  try {
    const raw = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch {
    errors.push("Missing or invalid .claude-plugin/plugin.json");
  }

  if (manifest) {
    if (!manifest.name) errors.push("plugin.json missing required field: name");
    if (!manifest.version) warnings.push("plugin.json missing recommended field: version");
    if (!manifest.description) warnings.push("plugin.json missing recommended field: description");
    if (!manifest.license) warnings.push("plugin.json missing recommended field: license");
    if (manifest.name && manifest.name !== name) {
      errors.push(`plugin.json name "${manifest.name}" does not match directory name "${name}"`);
    }
  }

  // Check for README
  try {
    await readFile(join(pluginDir, "README.md"), "utf-8");
  } catch {
    warnings.push("Missing README.md");
  }

  // Check at least one component exists
  const components = ["commands", "skills", "agents", "hooks", ".mcp.json", ".lsp.json"];
  let found = false;
  for (const c of components) {
    try {
      const { statSync } = await import("fs");
      statSync(join(pluginDir, c));
      found = true;
      break;
    } catch {}
  }
  if (!found) errors.push("No plugin components found (commands/, skills/, agents/, hooks/, .mcp.json)");

  return { plugin: name, pass: errors.length === 0, errors, warnings };
}

async function main() {
  const targetPlugin = process.argv[2];

  // Validate marketplace manifest
  let marketplace: MarketplaceManifest;
  try {
    marketplace = JSON.parse(await readFile(MARKETPLACE_MANIFEST, "utf-8"));
    console.log(`Marketplace: ${marketplace.name} (${marketplace.plugins.length} plugins)\n`);
  } catch {
    console.error("ERROR: Missing or invalid .claude-plugin/marketplace.json");
    process.exit(1);
  }

  // Get plugin dirs
  const allDirs = await readdir(PLUGINS_DIR);
  const pluginDirs = targetPlugin
    ? allDirs.filter((d) => d === targetPlugin)
    : allDirs;

  if (pluginDirs.length === 0) {
    console.error(`No plugins found${targetPlugin ? ` matching "${targetPlugin}"` : ""}`);
    process.exit(1);
  }

  // Check all plugins are registered in marketplace.json
  const registeredNames = marketplace.plugins.map((p) => p.name);
  for (const dir of allDirs) {
    if (!registeredNames.includes(dir)) {
      console.warn(`WARNING: Plugin directory "${dir}" is not registered in marketplace.json\n`);
    }
  }

  // Validate each plugin
  let totalErrors = 0;
  for (const dir of pluginDirs) {
    const result = await validatePlugin(join(PLUGINS_DIR, dir));
    const icon = result.pass ? "✅" : "❌";
    console.log(`${icon} ${result.plugin}`);
    for (const e of result.errors) console.log(`   ERROR: ${e}`);
    for (const w of result.warnings) console.log(`   WARN:  ${w}`);
    if (result.errors.length === 0 && result.warnings.length === 0) console.log("   All checks passed");
    console.log();
    totalErrors += result.errors.length;
  }

  if (totalErrors > 0) {
    console.error(`Validation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log("All plugins valid.");
  }
}

main();
