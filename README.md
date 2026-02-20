<p align="center">
  <img src="banner.svg" alt="Claude Skills" width="100%" />
</p>

# Claude Skills

A curated collection of Claude Code plugins — skills, agents, commands, and hooks that extend what Claude can do in your codebase.

## Plugins

| Plugin | Description | Keywords |
|--------|-------------|----------|
| [riviere-architect](plugins/riviere-architect/) | Extract and map existing software architecture as structured, queryable component graphs | `architecture` `system-design` `documentation` `diagrams` |

## Quick Start

### 1. Add this marketplace

```bash
/plugin marketplace add adamNewell/claude-skills
```

### 2. Install a plugin

```bash
/plugin install riviere-architect --scope project
```

**Scopes:**

| Scope | Effect |
|-------|--------|
| `user` | Available in all your projects (`~/.claude/settings.json`) |
| `project` | Shared via version control (`.claude/settings.json`) |
| `local` | Personal, gitignored (`.claude/settings.local.json`) |

## Repository Structure

```
claude-skills/
├── plugins/
│   └── riviere-architect/          # Architecture extraction plugin
│       ├── skills/                 # Auto-invoked skills
│       ├── agents/                 # Specialized subagents
│       ├── commands/               # Slash commands
│       ├── cookbook/                # CLI reference docs
│       └── hooks/                  # Lifecycle hooks
└── scripts/
    └── validate.ts                 # Plugin manifest validator
```

## Plugin Component Types

| Directory | Type | Description |
|-----------|------|-------------|
| `skills/name/SKILL.md` | Skills | Auto-invoked by Claude based on context |
| `agents/*.md` | Agents | Specialized subagents Claude can spawn |
| `commands/*.md` | Slash commands | `/command` invocable by users |
| `hooks/hooks.json` | Hooks | Lifecycle event handlers |
| `cookbook/` | Reference docs | On-demand CLI and tool documentation |

## Adding a Plugin

1. Create `plugins/my-plugin/.claude-plugin/plugin.json` with `{ "name": "my-plugin" }`
2. Add component directories (`skills/`, `commands/`, `agents/`, etc.)
3. Register in `.claude-plugin/marketplace.json` under `"plugins"`
4. Validate: `bun scripts/validate.ts my-plugin`

## License

MIT
