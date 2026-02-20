<p align="center">
  <img src="banner.svg" alt="Claude Plugin Marketplace" width="100%" />
</p>

# Claude Plugin Marketplace

Architecture plugins that extend what Claude Code can see, map, and build in your codebase.

## Plugins

| Plugin                                          | Description                                                                              | Keywords                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [riviere-architect](plugins/riviere-architect/) | Extract and map existing software architecture as structured, queryable component graphs | `architecture` `system-design` `documentation` `diagrams` |
| [waf-analysis](plugins/waf-analysis/)           | AWS Well-Architected Framework best practices for architecture reviews                   | `aws` `well-architected` `security` `reliability`         |

## Quick Start

### 1. Add this marketplace

```bash
/plugin marketplace add adamNewell/claude-cloud-architect
```

### 2. Install a plugin

```bash
/plugin install riviere-architect --scope project
```

**Scopes:**

| Scope     | Effect                                                     |
| --------- | ---------------------------------------------------------- |
| `user`    | Available in all your projects (`~/.claude/settings.json`) |
| `project` | Shared via version control (`.claude/settings.json`)       |
| `local`   | Personal, gitignored (`.claude/settings.local.json`)       |

## Repository Structure

```
claude-cloud-architect/
├── plugins/
│   ├── riviere-architect/          # Architecture extraction plugin
│   │   ├── skills/                 # Auto-invoked skills
│   │   ├── agents/                 # Specialized subagents
│   │   ├── commands/               # Slash commands
│   │   ├── cookbook/                # CLI reference docs
│   │   └── hooks/                  # Lifecycle hooks
│   └── waf-analysis/               # Well-Architected Framework plugin
│       ├── skills/                 # WAF review & audit skills (4)
│       ├── agents/                 # Pillar reviewers & MCP auditors (11)
│       ├── data/                   # Practice data (300+ practices, 14 lenses)
│       └── scripts/                # Data generation & query CLI
└── scripts/
    └── validate.ts                 # Plugin manifest validator
```

## Plugin Component Types

| Directory              | Type           | Description                             |
| ---------------------- | -------------- | --------------------------------------- |
| `skills/name/SKILL.md` | Skills         | Auto-invoked by Claude based on context |
| `agents/*.md`          | Agents         | Specialized subagents Claude can spawn  |
| `commands/*.md`        | Slash commands | `/command` invocable by users           |
| `hooks/hooks.json`     | Hooks          | Lifecycle event handlers                |
| `cookbook/`            | Reference docs | On-demand CLI and tool documentation    |

## Adding a Plugin

1. Create `plugins/my-plugin/.claude-plugin/plugin.json` with `{ "name": "my-plugin" }`
2. Add component directories (`skills/`, `commands/`, `agents/`, etc.)
3. Register in `.claude-plugin/marketplace.json` under `"plugins"`
4. Validate: `bun scripts/validate.ts my-plugin`

## License

MIT
