# Subagent Constraints

These rules apply to ALL subagents. Read this file before starting any subagent work.

**NEVER** invent domain names — always check `.riviere/config/domains.md` first. Use the canonical name exactly as written.
**NEVER** use plan mode in extraction steps — execute directly.
**NEVER** run `riviere builder` write commands from subagents. Subagents stage files only; coordinators execute all writes sequentially.
