---
"@mmntm/weblate-mcp": patch
---

Add a `Dockerfile` (and `.dockerignore`) so the MCP server can be run as a container over STDIO. Also bump `@modelcontextprotocol/sdk` to the latest 1.x in the lockfile, which `@rekog/mcp-nest` requires at runtime (the previously pinned 1.10.0 was missing modules and failed to start).
