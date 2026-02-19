---
description: Prime context by exploring the plugin structure and README
argument-hint: [plugin-name]
---

# Purpose

Explore the codebase structure and documentation to build a foundational understanding of the marketplace/plugin, then summarize key findings.

## Variables

PLUGIN_NAME: $ARGUMENTS

## Workflow

1. **Locate Plugin**: If `PLUGIN_NAME` is provided, focus on `plugins/PLUGIN_NAME/`. Otherwise, start at the root.
2. **Read Documentation**: Read `README.md` and `.claude-plugin/marketplace.json` to understand the overall purpose and available plugins.
3. **Explore Structure**: List files in the target directory to understand the component types (skills, commands, hooks, etc.).
4. **Analyze Manifests**: Read `.claude-plugin/plugin.json` and any configuration files like `.mcp.json` or `hooks/hooks.json`.
5. **Summarize**: Provide a brief overview of the plugin's capabilities and how to interact with it.
