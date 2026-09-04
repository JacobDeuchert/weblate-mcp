import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Normalizes a language code for allowlist comparison.
 * Lowercases and treats `_` and `-` as equivalent
 * (e.g. `pt_BR` matches `pt-BR`).
 */
export function normalizeLanguageCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

/**
 * Parses a comma-separated allowlist env value into normalized codes.
 * Returns `null` when unset/empty, meaning "all languages allowed".
 */
export function parseAllowedLanguages(
  rawValue: string | undefined,
): string[] | null {
  if (!rawValue || rawValue.trim() === '') {
    return null;
  }
  const codes = [
    ...new Set(
      rawValue
        .split(',')
        .map((c) => normalizeLanguageCode(c))
        .filter((c) => c !== ''),
    ),
  ];
  return codes.length > 0 ? codes : null;
}

@Injectable()
export class AllowedLanguagesService {
  constructor(
    @Optional()
    @Inject(ConfigService)
    private readonly configService?: ConfigService,
  ) {}

  /**
   * Returns the normalized allowlist, or `null` when no restriction
   * is configured (backward compatible: allow all).
   */
  getAllowedLanguages(): string[] | null {
    const fromConfig = this.configService?.get<string>('ALLOWED_LANGUAGES');
    const raw = fromConfig ?? process.env.ALLOWED_LANGUAGES;
    return parseAllowedLanguages(raw);
  }

  isLanguageAllowed(languageCode: string): boolean {
    const allowed = this.getAllowedLanguages();
    if (!allowed) {
      return true;
    }
    return allowed.includes(normalizeLanguageCode(languageCode));
  }

  /**
   * Throws when the language is not in the allowlist.
   * Write paths call this before touching the Weblate API.
   */
  assertLanguageAllowed(languageCode: string): void {
    const allowed = this.getAllowedLanguages();
    if (!allowed) {
      return;
    }
    if (!allowed.includes(normalizeLanguageCode(languageCode))) {
      throw new Error(
        `Language "${languageCode}" is not allowed by this MCP server. Allowed languages: ${allowed.join(', ')}`,
      );
    }
  }
}
