# Architecture Overview

This document provides a comprehensive overview of the Weblate MCP Server architecture, design patterns, and codebase organization.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MCP Clients (one or many, concurrent)          │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (JSON-RPC over Streamable HTTP, POST /mcp)
┌─────────────────────▼───────────────────────────────────────┐
│                 Weblate MCP Server                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                NestJS Application                       ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │ MCP Tools   │  │  Services   │  │   Types     │    ││
│  │  │ Layer       │  │   Layer     │  │   Layer     │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                  Weblate Instance                           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts             # Root NestJS module
├── services/                 # Business logic layer
│   ├── index.ts             # Service exports
│   ├── weblate-client.service.ts        # Generated OpenAPI client wrapper
│   ├── weblate-api.service.ts           # Main service facade
│   └── weblate/             # Specialized Weblate services
│       ├── index.ts                     # Weblate service exports
│       ├── base-weblate.service.ts      # Base HTTP client (legacy)
│       ├── projects.service.ts          # Project operations
│       ├── components.service.ts        # Component operations
│       ├── translations.service.ts      # Translation operations
│       ├── languages.service.ts         # Language operations
│       ├── changes.service.ts           # Change tracking & history
│       └── statistics.service.ts        # Translation statistics & analytics
├── tools/                    # MCP tool implementations
│   ├── index.ts             # Tool exports
│   ├── projects.tool.ts     # Project management tools
│   ├── components.tool.ts   # Component management tools
│   ├── languages.tool.ts    # Language management tools
│   ├── translations.tool.ts # Translation management tools
│   ├── changes.tool.ts      # Change tracking tools
│   ├── statistics.tool.ts   # Statistics dashboard tools
│   └── debug.tool.ts        # Development and debugging tools
└── types/                   # TypeScript definitions
    ├── index.ts            # Type exports
    └── weblate.types.ts    # Weblate API types
```

## 🎯 Design Patterns

### 1. Service Layer Pattern

The application uses a layered architecture with clear separation of concerns:

- **Tools Layer**: MCP tool implementations that handle user requests
- **Services Layer**: Business logic and API communication
- **Types Layer**: TypeScript definitions and data contracts

### 2. Composition Pattern

The main `WeblateApiService` uses composition to combine specialized services:

```typescript
@Injectable()
export class WeblateApiService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly componentsService: ComponentsService,
    private readonly translationsService: TranslationsService,
    private readonly languagesService: LanguagesService,
  ) {}
}
```

### 3. Inheritance Pattern

Specialized services inherit from `BaseWeblateService` for shared functionality:

```typescript
@Injectable()
export class ProjectsService extends BaseWeblateService {
  // Inherits HTTP client configuration and common methods
}
```

### 4. Dependency Injection

NestJS dependency injection container manages service lifecycles and dependencies:

```typescript
@Module({
  providers: [
    BaseWeblateService,
    ProjectsService,
    ComponentsService,
    TranslationsService,
    LanguagesService,
    WeblateApiService,
  ],
  exports: [WeblateApiService],
})
export class AppModule {}
```

## ✨ Key Features & Capabilities

### 📊 Translation Statistics Dashboard
The statistics system provides comprehensive analytics and insights:

- **Project-level statistics**: Overall completion rates, string counts, and progress metrics
- **Component-level analytics**: Detailed statistics for individual translation components
- **Language progress tracking**: Multi-language progress visualization with progress bars
- **User contribution metrics**: Individual contributor statistics and activity tracking
- **Cross-project language analytics**: Language performance across all projects
- **Dashboard overview**: Comprehensive project dashboard with all component breakdowns

Implementation leverages the generated OpenAPI client for robust API integration with proper error handling and data validation.

### 📈 Change Tracking & History
Advanced change monitoring and audit capabilities:

- **Real-time change tracking**: Monitor all translation changes across projects
- **User activity monitoring**: Track individual contributor activity and changes
- **Project/component-specific history**: Focused change logs for specific areas
- **Temporal filtering**: Filter changes by timestamp ranges and users
- **Action categorization**: 52+ mapped action types (translations, approvals, commits, etc.)

### 🔧 Enhanced Translation Management
Comprehensive translation workflow support:

- **Advanced search capabilities**: Search by content, keys, and patterns
- **Bulk operations**: List and manage translation keys efficiently
- **Write operations**: Update translations with approval workflow support
- **Cross-component discovery**: Find translations across multiple components
- **Pattern matching**: Flexible key and content search with regex support

### 🏗️ Robust Architecture
Modern, scalable design principles:

- **Generated OpenAPI client**: Type-safe API integration with automatic client generation
- **Modular tool architecture**: Separated tools by functionality for maintainability
- **Dependency injection**: Proper service composition and lifecycle management
- **Error resilience**: Comprehensive error handling with graceful degradation
- **Service separation**: Specialized services for different functional domains

## 🔧 Core Components

### Base Service (`BaseWeblateService`)

Provides shared functionality for all Weblate API services:

- HTTP client configuration with authentication
- Common error handling
- Request/response logging
- Rate limiting handling

```typescript
@Injectable()
export class BaseWeblateService {
  protected readonly httpService: HttpService;
  protected readonly baseUrl: string;
  protected readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.WEBLATE_API_URL;
    this.headers = {
      'Authorization': `Token ${process.env.WEBLATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }
}
```

### Specialized Services

Each service handles a specific domain of Weblate API operations:

#### ProjectsService
- `listProjects()`: List all projects
- `getProject(slug)`: Get project details
- `createProject(data)`: Create new project

#### ComponentsService
- `listComponents(projectSlug)`: List project components
- `getComponent(projectSlug, componentSlug)`: Get component details
- `createComponent(projectSlug, data)`: Create new component

#### TranslationsService
- `listTranslations(projectSlug, componentSlug)`: List translations
- `getTranslation(projectSlug, componentSlug, languageCode)`: Get translation
- `updateTranslation(projectSlug, componentSlug, languageCode, data)`: Update translation

#### LanguagesService
- `listLanguages()`: List available languages
- `getLanguage(code)`: Get language details

### MCP Tools

Tools implement the Model Context Protocol interface and delegate to services:

```typescript
export const listProjectsTool: Tool = {
  name: 'list_projects',
  description: 'List all projects in the Weblate instance',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    const weblateService = app.get(WeblateApiService);
    return await weblateService.listProjects();
  },
};
```

## 🔄 Data Flow

### Request Flow

1. **MCP Client** sends tool request via JSON-RPC
2. **MCP Server** receives and validates request
3. **Tool Handler** processes request parameters
4. **Service Layer** makes HTTP request to Weblate API
5. **Base Service** handles authentication and error handling
6. **Response** flows back through the layers to client

```
Client Request → MCP Tool → Service → HTTP Client → Weblate API
                    ↓
Client Response ← MCP Tool ← Service ← HTTP Response ← Weblate API
```

### Error Handling Flow

```typescript
try {
  const response = await this.httpService.get(url, { headers: this.headers });
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    throw new Error('Authentication failed. Check your API token.');
  }
  if (error.response?.status === 404) {
    throw new Error('Resource not found.');
  }
  throw new Error(`API request failed: ${error.message}`);
}
```

## 🔐 Configuration Management

### Environment Variables

Configuration is managed through environment variables:

```typescript
interface Config {
  WEBLATE_API_URL: string;      // Required: Weblate API base URL
  WEBLATE_API_TOKEN: string;    // Required: API authentication token
  PORT: number;                 // Optional: Server port (default: 3000)
  NODE_ENV: string;            // Optional: Environment mode
}
```

### Configuration Validation

NestJS ConfigModule validates configuration on startup:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => {
        if (!config.WEBLATE_API_URL) {
          throw new Error('WEBLATE_API_URL is required');
        }
        if (!config.WEBLATE_API_TOKEN) {
          throw new Error('WEBLATE_API_TOKEN is required');
        }
        return config;
      },
    }),
  ],
})
export class AppModule {}
```

## 🚀 Startup Process

1. **Environment Loading**: Load and validate environment variables
2. **Module Initialization**: Initialize NestJS modules and providers
3. **Service Registration**: Register all services with dependency injection
4. **MCP Server Setup**: Configure MCP protocol handlers
5. **Tool Registration**: Register all available tools
6. **Server Start**: Start listening for MCP requests

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'development' ? true : false,
  });
  
  // Configure MCP server
  const mcpServer = new McpServer(app);
  mcpServer.registerTools([
    ...projectTools,
    ...componentTools,
    ...translationTools,
    ...languageTools,
  ]);
  
  await mcpServer.start();
}
```

## 🔍 Type Safety

### Strong Typing

All API responses and requests are strongly typed:

```typescript
interface WeblateProject {
  url: string;
  name: string;
  slug: string;
  web?: string;
  source_language: WeblateLanguage;
  // ... other properties
}

interface CreateProjectRequest {
  name: string;
  slug: string;
  web?: string;
  source_language?: string;
}
```

### Type Guards

Type guards ensure runtime type safety:

```typescript
function isWeblateProject(obj: any): obj is WeblateProject {
  return obj && 
         typeof obj.name === 'string' && 
         typeof obj.slug === 'string' &&
         obj.source_language;
}
```

## 🧪 Testing Strategy

### Unit Tests

Each service has comprehensive unit tests:

```typescript
describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should list projects', async () => {
    const result = await service.listProjects();
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

E2E tests verify the complete request flow:

```typescript
describe('MCP Tools (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should handle list_projects tool', async () => {
    const result = await callMcpTool('list_projects', {});
    expect(result.results).toBeDefined();
  });
});
```

## 📈 Performance Considerations

### HTTP Client Optimization

- Connection pooling for HTTP requests
- Request timeout configuration
- Retry logic for failed requests

### Memory Management

- Efficient data structures for large result sets
- Streaming for large file operations
- Garbage collection optimization

### Caching Strategy

Future enhancement: Implement caching for frequently accessed data:

```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
}
```

## 🔮 Future Enhancements

### Planned Improvements

1. **Caching Layer**: Redis-based caching for API responses
2. **Rate Limiting**: Client-side rate limiting to respect API limits
3. **Batch Operations**: Support for bulk operations
4. **Real-time Updates**: WebSocket support for live updates
5. **Metrics**: Performance monitoring and metrics collection

### Extensibility Points

The architecture supports easy extension:

- **New Services**: Add new specialized services following the same pattern
- **New Tools**: Implement additional MCP tools
- **Custom Middleware**: Add request/response middleware
- **Plugin System**: Future plugin architecture for custom functionality

## 📚 References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Weblate API Documentation](https://docs.weblate.org/en/latest/api.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) 