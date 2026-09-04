import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import {
  WeblateApiService,
  AllowedLanguagesService,
  WeblateProjectsService,
  WeblateComponentsService,
  WeblateLanguagesService,
  WeblateTranslationsService,
} from './services';
import { WeblateClientService } from './services/weblate-client.service';
import {
  WeblateProjectsTool,
  WeblateComponentsTool,
  WeblateLanguagesTool,
  WeblateTranslationsTool,
} from './tools';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    McpModule.forRoot({
      name: process.env.MCP_SERVER_NAME || 'weblate-mcp-server',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      transport: McpTransportType.STDIO,
      instructions: `This is a Weblate MCP server that provides tools for managing translations.

Available tools:
Discovery:
- listProjects: List all available Weblate projects
- listComponents: List components in a specific project
- listLanguages: List languages available in a specific project

Translation Management:
- searchStringInProject: Search for translations containing specific text
- searchUnitsWithFilters: Search translation units using Weblate's filter syntax
- getTranslationForKey: Get translation value for a specific key
- findTranslationsForKey: Find all translations for a specific key across components and languages
- writeTranslation: Write or update a translation value
- bulkWriteTranslations: Update multiple translations in a single batch
- createTranslationUnit: Create a new translation unit (key) - supports monolingual and bilingual formats`,
    }),
  ],
  providers: [
    WeblateClientService,
    AllowedLanguagesService,
    WeblateProjectsService,
    WeblateComponentsService,
    WeblateLanguagesService,
    WeblateTranslationsService,
    WeblateApiService,
    WeblateProjectsTool,
    WeblateComponentsTool,
    WeblateLanguagesTool,
    WeblateTranslationsTool,
  ],
})
export class AppModule {}
