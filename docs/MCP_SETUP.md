# Weblate MCP Server Setup

This guide shows you how to run the Weblate MCP (Model Context Protocol) server as a container and connect MCP-compatible clients to it.

## Quick Start

The server runs as a single stateless HTTP container. Credentials live in the
container, not in any client config — every client that connects uses that one
Weblate token.

### 1. Build and run the container

```bash
docker build -t weblate-mcp .

docker run -d --name weblate-mcp -p 3000:3000 \
  -e WEBLATE_API_URL=https://your-weblate-instance.com/api \
  -e WEBLATE_API_TOKEN=your-weblate-api-token \
  weblate-mcp
```

Environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBLATE_API_URL` | yes | Weblate API endpoint, e.g. `https://hosted.weblate.org/api` |
| `WEBLATE_API_TOKEN` | yes | Weblate API token |
| `PORT` | no | Listen port, defaults to `3000` |
| `ALLOWED_LANGUAGES` | no | Comma-separated write allowlist, e.g. `de,fr,sk`. Empty = all |
| `MCP_SERVER_NAME` / `MCP_SERVER_VERSION` | no | Identity reported during `initialize` |

### 2. Get your Weblate API token

1. Log into your Weblate instance
2. Go to **Settings** → **API access**
3. Create a new token or copy an existing one
4. The token should have appropriate permissions for the projects you want to manage

### 3. Connect your clients

Any number of MCP clients can point at the same container concurrently.

**Claude Code:**
```bash
claude mcp add --transport http weblate http://localhost:3000/mcp
```

**Claude Desktop / Cursor / VS Code:**
```json
{
  "mcpServers": {
    "weblate": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Multiple Weblate instances

Run one container per instance on different ports:

```bash
docker run -d --name weblate-prod -p 3000:3000 \
  -e WEBLATE_API_URL=https://weblate-prod.company.com/api \
  -e WEBLATE_API_TOKEN=wlt_prod_token weblate-mcp

docker run -d --name weblate-staging -p 3001:3000 \
  -e WEBLATE_API_URL=https://weblate-staging.company.com/api \
  -e WEBLATE_API_TOKEN=wlt_staging_token weblate-mcp
```

Then register them as two MCP servers (`weblate-prod`, `weblate-staging`)
pointing at `http://localhost:3000/mcp` and `http://localhost:3001/mcp`.

## Available Tools

Once configured, you'll have access to these translation management tools:

- **listProjects** - List all available Weblate projects
- **listComponents** - List components in a specific project  
- **listLanguages** - List languages available in a project
- **searchUnitsWithFilters** ⭐ - **Efficient search using Weblate's native filtering syntax**
- **searchStringInProject** - Search for translations containing specific text
- **getTranslationForKey** - Get translation value for a specific key
- **writeTranslation** - Write or update a translation value
- **bulkWriteTranslations** ⚡ - **Batch update multiple translations efficiently**
- **findTranslationsForKey** - Find all translations for a specific key

## Usage Examples

### ⭐ Efficient Translation Search (Recommended)

Use `searchUnitsWithFilters` for the most efficient queries:

> "Find all untranslated strings in Slovak for the 'common' component using `searchUnitsWithFilters` with query `state:=0`"

> "Show me strings that need editing in French for the 'frontend' component using `searchUnitsWithFilters` with query `state:=10`"

> "Find all strings containing 'error' in the source text using `searchUnitsWithFilters` with query `source:\"error\"`"

### General Translation Management

> "List all projects in my Weblate instance"

> "Show me all languages available for the 'mobile-app' project"

> "Find all translations containing 'login' in the 'web-frontend' project"

> "Update the French translation for key 'welcome.message' to 'Bienvenue sur notre plateforme'"

### ⚡ Efficient Bulk Updates

> "Update multiple French translations for the 'frontend' component using `bulkWriteTranslations` with this data: [{'key': 'login.button', 'value': 'Se connecter'}, {'key': 'logout.button', 'value': 'Se déconnecter'}]"

> "Import these 10 translations from my CSV file using `bulkWriteTranslations`"

> "Mark these 5 translations as approved in batch using `bulkWriteTranslations`"

### 🚀 Why searchUnitsWithFilters is Better

Instead of asking for "all translation keys" and then checking each one individually (which can make thousands of API calls), use efficient filtering:

- **❌ Inefficient**: "List all keys, then check each one for translation status"
- **✅ Efficient**: "Search for untranslated strings using `state:=0` filter"

The `searchUnitsWithFilters` tool uses Weblate's native search capabilities for optimal performance.

## Troubleshooting

### Common Issues

1. **"Server failed to start"** — check the container logs with
   `docker logs weblate-mcp`. Missing `WEBLATE_API_URL` or
   `WEBLATE_API_TOKEN` makes the server exit at startup.
2. **Client cannot connect** — confirm the container is up and the port is
   published: `docker ps`. The endpoint is `/mcp`, not `/`.
3. **"API authentication failed"** — the token is invalid, expired, or lacks
   access to the project.

### Manual Testing

```bash
# List the tools the server exposes (no session handshake needed — it is stateless)
curl -s -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Logs and Debugging

```bash
docker logs -f weblate-mcp
```

Test the Weblate API directly to isolate credential problems:
`curl -H "Authorization: Token YOUR_TOKEN" https://your-weblate-instance.com/api/projects/`

## Security Notes

- Keep your Weblate API tokens secure and don't share them
- Use tokens with minimal necessary permissions
- Consider using project-specific tokens if your Weblate instance supports them
- Regularly rotate your API tokens

## More Information

- [Weblate API Documentation](https://docs.weblate.org/en/latest/api.html)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [Claude Desktop Configuration](https://docs.anthropic.com/claude/docs)

## Support

If you encounter issues:
1. Check this documentation first
2. Verify your Weblate API setup
3. Check the container logs with `docker logs weblate-mcp`
4. Report issues on the [GitHub repository](https://github.com/mmntm/weblate-mcp) 