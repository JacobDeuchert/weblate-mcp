# Weblate MCP Server Documentation

Welcome to the comprehensive documentation for the Weblate Model Context Protocol (MCP) Server. This documentation will help you understand, install, configure, and contribute to the project.

## 📚 Documentation Overview

### Getting Started
- **[Installation & Setup](./MCP_SETUP.md)** - Complete guide to installing and configuring the MCP server
- **[Quick Start](#quick-start)** - Get up and running in minutes

### Development & Contributing
- **[Development Guide](./DEVELOPMENT.md)** - Setting up the development environment
- **[API Reference](./API.md)** - Complete API documentation
- **[Architecture](./ARCHITECTURE.md)** - Understanding the codebase structure

## 🚀 Quick Start

### Run the container
```bash
docker build -t weblate-mcp .

docker run -d --name weblate-mcp -p 3000:3000 \
  -e WEBLATE_API_URL=https://your-weblate-instance.com/api \
  -e WEBLATE_API_TOKEN=your-api-token \
  weblate-mcp
```

### Connect a client
The server is stateless, so any number of clients can share one container.

```bash
claude mcp add --transport http weblate http://localhost:3000/mcp
```

Or, for config-file based clients:
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

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEBLATE_API_URL` | Your Weblate instance API URL | ✅ |
| `WEBLATE_API_TOKEN` | Your Weblate API token | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `NODE_ENV` | Environment mode | ❌ |
| `ALLOWED_LANGUAGES` | Comma-separated write allowlist (empty = all) | ❌ |

## 📖 Available Tools

The MCP server provides comprehensive tools for interacting with Weblate:

### Project Management
- `listProjects` - List all available Weblate projects
- Comprehensive project information with URLs and metadata

### Component Management
- `listComponents` - List components in a specific project
- Component details with source language information

### Translation Management
- `searchUnitsWithFilters` ⭐ - **Efficient search using Weblate's native filtering syntax**
- `searchStringInProject` - Search for translations containing specific text
- `getTranslationForKey` - Get translation value for a specific key
- `writeTranslation` - Update or write translation values with approval support
- `bulkWriteTranslations` ⚡ - **Batch update multiple translations efficiently**
- `findTranslationsForKey` - Find all translations for a specific key

### Language Management
- `listLanguages` - List languages available in a specific project

### 📊 Translation Statistics Dashboard
- `getProjectStatistics` - Comprehensive project statistics with completion rates
- `getComponentStatistics` - Detailed statistics for specific components
- `getProjectDashboard` - Complete dashboard overview with all component statistics
- `getTranslationStatistics` - Statistics for specific translation combinations
- `getComponentLanguageProgress` - Translation progress for all languages in a component
- `getLanguageStatistics` - Statistics for a language across all projects
- `getUserStatistics` - User contribution statistics and activity metrics

### 📈 Change Tracking & History
- `listRecentChanges` - Recent changes across all projects with filtering
- `getProjectChanges` - Recent changes for a specific project
- `getComponentChanges` - Recent changes for a specific component
- `getChangesByUser` - Recent changes by a specific user

## 🏗️ Architecture

The server is built with:
- **NestJS** - Modern Node.js framework
- **TypeScript** - Type-safe development
- **MCP SDK** - Model Context Protocol implementation
- **Modular Services** - Clean separation of concerns

```
src/
├── services/weblate/     # Weblate API services
│   ├── base-weblate.service.ts
│   ├── projects.service.ts
│   ├── components.service.ts
│   ├── translations.service.ts
│   └── languages.service.ts
├── types/               # TypeScript definitions
├── tools/              # MCP tool implementations
└── main.ts            # Application entry point
```

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](./DEVELOPMENT.md) for details on:
- Setting up the development environment
- Code style and conventions
- Testing procedures
- Submitting pull requests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/mmntm/weblate-mcp)
- [NPM Package](https://www.npmjs.com/package/@mmntm/weblate-mcp)
- [Weblate Documentation](https://docs.weblate.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📞 Support

If you encounter any issues or have questions:
1. Check the [documentation](./MCP_SETUP.md)
2. Search [existing issues](https://github.com/mmntm/weblate-mcp/issues)
3. Create a [new issue](https://github.com/mmntm/weblate-mcp/issues/new) 