import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  AllowedLanguagesService,
  normalizeLanguageCode,
  parseAllowedLanguages,
} from './allowed-languages.service';
import { WeblateTranslationsService } from './weblate/translations.service';
import { WeblateLanguagesService } from './weblate/languages.service';
import * as sdk from '../client/sdk.gen';

describe('parseAllowedLanguages', () => {
  it('returns null when unset or empty', () => {
    expect(parseAllowedLanguages(undefined)).toBeNull();
    expect(parseAllowedLanguages('')).toBeNull();
    expect(parseAllowedLanguages('   ')).toBeNull();
    expect(parseAllowedLanguages(', ,')).toBeNull();
  });

  it('parses comma-separated codes, normalized and deduped', () => {
    expect(parseAllowedLanguages('de,fr, sk ')).toEqual(['de', 'fr', 'sk']);
    expect(parseAllowedLanguages('DE,de, Fr')).toEqual(['de', 'fr']);
    expect(parseAllowedLanguages('pt_BR')).toEqual(['pt-br']);
  });
});

describe('normalizeLanguageCode', () => {
  it('treats underscore and dash as equivalent, case-insensitive', () => {
    expect(normalizeLanguageCode('pt_BR')).toBe('pt-br');
    expect(normalizeLanguageCode('PT-BR')).toBe('pt-br');
  });
});

describe('AllowedLanguagesService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.ALLOWED_LANGUAGES;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('allows all when env is unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllowedLanguagesService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();
    const svc = module.get(AllowedLanguagesService);
    expect(svc.getAllowedLanguages()).toBeNull();
    expect(svc.isLanguageAllowed('de')).toBe(true);
    expect(() => svc.assertLanguageAllowed('zh')).not.toThrow();
  });

  it('reads allowlist from ConfigService, falling back to process.env', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllowedLanguagesService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('de, fr') } },
      ],
    }).compile();
    const svc = module.get(AllowedLanguagesService);
    expect(svc.getAllowedLanguages()).toEqual(['de', 'fr']);
    expect(svc.isLanguageAllowed('DE')).toBe(true);
    expect(svc.isLanguageAllowed('sk')).toBe(false);
    expect(() => svc.assertLanguageAllowed('sk')).toThrow(
      'Language "sk" is not allowed',
    );
  });

  it('falls back to process.env when ConfigService is absent', () => {
    process.env.ALLOWED_LANGUAGES = 'sk,cs';
    const svc = new AllowedLanguagesService(undefined as any);
    expect(svc.getAllowedLanguages()).toEqual(['sk', 'cs']);
    expect(svc.isLanguageAllowed('sk')).toBe(true);
    expect(svc.isLanguageAllowed('de')).toBe(false);
  });
});

describe('TranslationsService allowlist enforcement', () => {
  const mockClient = {};

  function buildService(allowlist: string | undefined) {
    const config = { get: jest.fn().mockReturnValue(allowlist) };
    const guard = new AllowedLanguagesService(config as any);
    return new WeblateTranslationsService(
      { getClient: () => mockClient } as any,
      guard,
    );
  }

  afterEach(() => jest.restoreAllMocks());

  it('writeTranslation rejects disallowed languages without calling the API', async () => {
    const service = buildService('de,fr');
    const spy = jest.spyOn(sdk, 'unitsList');
    await expect(
      service.writeTranslation('proj', 'comp', 'sk', 'KEY', 'val'),
    ).rejects.toThrow('Language "sk" is not allowed');
    expect(spy).not.toHaveBeenCalled();
  });

  it('writeTranslation allows listed languages', async () => {
    const service = buildService('de,fr');
    jest.spyOn(sdk, 'unitsList').mockResolvedValue({
      data: { results: [{ id: 1, context: 'KEY', source: ['Hi'] }], count: 1 },
      error: undefined,
    } as any);
    jest.spyOn(sdk, 'unitsPartialUpdate').mockResolvedValue({
      data: { target: ['Hallo'], state: 20 },
      error: undefined,
    } as any);
    const result = await service.writeTranslation(
      'proj',
      'comp',
      'de',
      'KEY',
      'Hallo',
    );
    expect(result).toMatchObject({ id: 1, context: 'KEY' });
  });

  it('createTranslationUnit rejects disallowed languages without calling the API', async () => {
    const service = buildService('de');
    const spy = jest.spyOn(sdk, 'translationsUnitsCreate');
    await expect(
      service.createTranslationUnit('proj', 'comp', 'fr', { key: 'k' }),
    ).rejects.toThrow('Language "fr" is not allowed');
    expect(spy).not.toHaveBeenCalled();
  });

  it('allows all when no allowlist is configured', async () => {
    const service = buildService(undefined);
    jest.spyOn(sdk, 'unitsList').mockResolvedValue({
      data: { results: [{ id: 1, context: 'KEY', source: ['Hi'] }], count: 1 },
      error: undefined,
    } as any);
    jest.spyOn(sdk, 'unitsPartialUpdate').mockResolvedValue({
      data: { target: ['x'], state: 20 },
      error: undefined,
    } as any);
    const result = await service.writeTranslation(
      'proj',
      'comp',
      'zh',
      'KEY',
      'x',
    );
    expect(result).toMatchObject({ id: 1 });
  });
});

describe('LanguagesService allowlist filtering', () => {
  afterEach(() => jest.restoreAllMocks());

  it('filters listLanguages to allowed codes', async () => {
    const guard = new AllowedLanguagesService({
      get: jest.fn().mockReturnValue('de,fr'),
    } as any);
    const service = new WeblateLanguagesService(
      { getClient: () => ({}) } as any,
      guard,
    );
    jest.spyOn(sdk, 'projectsLanguagesRetrieve').mockResolvedValue({
      data: [{ code: 'de' }, { code: 'sk' }, { code: 'FR' }],
      error: undefined,
    } as any);
    const result = await service.listLanguages('proj');
    expect(result.map((l: any) => l.code)).toEqual(['de', 'FR']);
  });

  it('returns all when no allowlist is configured', async () => {
    const guard = new AllowedLanguagesService({
      get: jest.fn().mockReturnValue(undefined),
    } as any);
    const service = new WeblateLanguagesService(
      { getClient: () => ({}) } as any,
      guard,
    );
    jest.spyOn(sdk, 'projectsLanguagesRetrieve').mockResolvedValue({
      data: [{ code: 'de' }, { code: 'sk' }],
      error: undefined,
    } as any);
    const result = await service.listLanguages('proj');
    expect(result).toHaveLength(2);
  });
});
