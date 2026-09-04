import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { WeblateClientService } from '../weblate-client.service';
import {
  AllowedLanguagesService,
  normalizeLanguageCode,
} from '../allowed-languages.service';
import { projectsLanguagesRetrieve, type Language } from '../../client';

@Injectable()
export class WeblateLanguagesService {
  private readonly logger = new Logger(WeblateLanguagesService.name);

  constructor(
    private weblateClientService: WeblateClientService,
    @Optional()
    @Inject(AllowedLanguagesService)
    private readonly allowedLanguages?: AllowedLanguagesService,
  ) {}

  async listLanguages(projectSlug: string): Promise<Language[]> {
    try {
      const client = this.weblateClientService.getClient();
      const response = await projectsLanguagesRetrieve({
        client,
        path: { slug: projectSlug }
      });
      
      // Handle different response formats
      const languages = response.data as any;
      
      let result: Language[];
      if (Array.isArray(languages)) {
        result = languages;
      } else if (languages && languages.results && Array.isArray(languages.results)) {
        // If it's a paginated response
        result = languages.results;
      } else if (languages && typeof languages === 'object') {
        // If it's a single language, wrap it in an array
        result = [languages];
      } else {
        result = [];
      }

      // When ALLOWED_LANGUAGES is set, only advertise allowed languages
      // so LLM clients naturally pick a permitted target.
      const allowed = this.allowedLanguages?.getAllowedLanguages();
      if (allowed) {
        const allowedSet = new Set(allowed);
        result = result.filter((l) =>
          allowedSet.has(normalizeLanguageCode(l.code)),
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to list languages for project ${projectSlug}`,
        error,
      );
      throw new Error(`Failed to list languages: ${error.message}`);
    }
  }
} 