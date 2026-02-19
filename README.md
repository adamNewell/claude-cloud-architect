# Claude Code Marketplace Template

A multi-plugin Claude Code marketplace repository. Add this marketplace to Claude Code and install any plugin with a single command.

## Add this marketplace

```
/plugin marketplace add yourusername/claude-marketplace-template
```

## Plugins

| Plugin | Type | Description |
| ------ | ---- | ----------- |
|        |      |             |

## Install a plugin

```
/plugin install mcp-plugin@my-marketplace --scope project
/plugin install skill-plugin@my-marketplace --scope user
```

**Scopes:**

- `user` — available in all your projects (`~/.claude/settings.json`)
- `project` — shared via version control (`.claude/settings.json`)
- `local` — personal, gitignored (`.claude/settings.local.json`)

## Repo structure

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace manifest (required)
├── plugins/
│   ├── mcp-plugin/             # One directory per plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json     # Plugin manifest
│   │   ├── .mcp.json           # MCP server config
│   │   └── README.md
│   ├── skill-plugin/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   └── hello-world/SKILL.md
│   │   └── README.md
│   ├── command-plugin/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── commands/
│   │   │   ├── summarize.md
│   │   │   └── todo.md
│   │   └── README.md
│   └── hooks-plugin/
│       ├── .claude-plugin/plugin.json
│       ├── hooks/
│       │   ├── hooks.json
│       │   ├── pre-bash.js
│       │   ├── post-write.js
│       │   └── on-notify.js
│       └── README.md
└── scripts/
    └── validate.ts             # Validate all plugin manifests
```

## Validate plugins

```bash
bun scripts/validate.ts              # validate all plugins
bun scripts/validate.ts mcp-plugin   # validate one plugin
```

## Adding a new plugin

1. Create `plugins/my-plugin/`
2. Create `plugins/my-plugin/.claude-plugin/plugin.json` with at minimum `{ "name": "my-plugin" }`
3. Add your component directories (`commands/`, `skills/`, `hooks/`, etc.)
4. Register in `.claude-plugin/marketplace.json` under `"plugins"`
5. Run `bun scripts/validate.ts my-plugin`

## Plugin component types

| Directory / File       | Type           | Description                             |
| ---------------------- | -------------- | --------------------------------------- |
| `commands/*.md`        | Slash commands | `/command` invocable by users           |
| `skills/name/SKILL.md` | Skills         | Auto-invoked by Claude based on context |
| `agents/*.md`          | Agents         | Specialized subagents Claude can spawn  |
| `hooks/hooks.json`     | Hooks          | Lifecycle event handlers                |
| `.mcp.json`            | MCP servers    | External tool/data integrations         |
| `.lsp.json`            | LSP servers    | Language intelligence providers         |
| `outputStyles/`        | Output styles  | Custom response formatting              |

## References

- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins)
- [Plugin Manifest Reference](https://code.claude.com/docs/en/plugins-reference)
- [Marketplace Distribution](https://code.claude.com/docs/en/plugin-marketplaces)
