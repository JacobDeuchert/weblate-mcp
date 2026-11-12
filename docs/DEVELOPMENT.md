# Development Guide

This guide will help you set up the development environment and contribute to the Weblate MCP Server project.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended package manager)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mmntm/weblate-mcp.git
cd weblate-mcp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your Weblate instance details:

```env
WEBLATE_API_URL=https://your-weblate-instance.com/api/
WEBLATE_API_TOKEN=your-api-token
PORT=3000
NODE_ENV=development
```

### 4. Build the Project

```bash
pnpm run build
```

### 5. Start Development Server

```bash
pnpm run dev
```

The server will start in watch mode and automatically restart when you make changes.

## 🏗️ Project Structure

```
weblate-mcp/
├── src/
│   ├── services/weblate/          # Weblate API services
│   │   ├── base-weblate.service.ts    # Base HTTP client
│   │   ├── projects.service.ts        # Project operations
│   │   ├── components.service.ts      # Component operations
│   │   ├── translations.service.ts    # Translation operations
│   │   └── languages.service.ts       # Language operations
│   ├── tools/                     # MCP tool implementations
│   ├── types/                     # TypeScript type definitions
│   │   └── weblate.types.ts          # Weblate API types
│   ├── app.module.ts             # NestJS application module
│   └── main.ts                   # Application entry point
├── docs/                         # Documentation
├── examples/                     # Usage examples
├── dist/                         # Compiled output
└── test/                         # Test files
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

### Writing Tests

- Unit tests should be placed alongside the source files with `.spec.ts` extension
- E2E tests go in the `test/` directory
- Use Jest for testing framework
- Mock external dependencies appropriately

Example test structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## 🔧 Development Scripts

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build the project |
| `pnpm run dev` | Start development server with watch mode |
| `pnpm run start` | Start production server |
| `pnpm run test` | Run tests |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:cov` | Run tests with coverage |
| `pnpm run format` | Format code with Prettier |

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Define proper interfaces for all data structures
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Formatting

- Use Prettier for code formatting
- Run `pnpm run format` before committing
- Configure your editor to format on save

### Linting

- Follow ESLint rules defined in `.eslintrc.js`
- Fix linting errors before committing

## 🏛️ Architecture Patterns

### Service Layer Architecture

The project uses a modular service architecture:

1. **Base Service** (`BaseWeblateService`): Handles HTTP client configuration and common functionality
2. **Specialized Services**: Inherit from base service and implement specific API operations
3. **Composition**: Main `WeblateApiService` composes all specialized services

### Dependency Injection

- Use NestJS dependency injection container
- Register services in `app.module.ts`
- Use constructor injection for dependencies

### Error Handling

- Use structured error handling with proper HTTP status codes
- Log errors appropriately for debugging
- Return meaningful error messages to users

## 🔄 Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the coding standards
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
pnpm run test
pnpm run build
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

- Create a PR against the `main` branch
- Provide a clear description of your changes
- Link any related issues

## 🚀 Shipping

The project is not published to npm — it is built and run as a container:

```bash
docker build -t weblate-mcp .
```

See [Setup](./MCP_SETUP.md) for running it and connecting clients.

## 🐛 Debugging

### Local Development

1. Set `NODE_ENV=development` in your `.env` file
2. Use `console.log` or debugger statements
3. Check the server logs for errors

### MCP Integration Testing

Since the server runs in development mode, you can test changes immediately:

1. Make code changes
2. The server will restart automatically
3. Test with your MCP client (Claude Desktop)
4. Check logs for any issues

### Common Issues

- **Port conflicts**: Change the `PORT` in `.env`
- **API authentication**: Verify your Weblate API token
- **Build errors**: Check TypeScript compilation errors

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Weblate API Documentation](https://docs.weblate.org/en/latest/api.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Getting Help

If you need help:

1. Check existing [GitHub Issues](https://github.com/mmntm/weblate-mcp/issues)
2. Create a new issue with detailed information
3. Join discussions in the repository

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Documentation is updated if needed
- [ ] PR description is clear and complete 