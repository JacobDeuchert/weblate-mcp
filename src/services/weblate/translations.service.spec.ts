import { Test, TestingModule } from '@nestjs/testing';
import { WeblateTranslationsService } from './translations.service';
import { WeblateClientService } from '../weblate-client.service';
import * as sdk from '../../client/sdk.gen';

describe('WeblateTranslationsService', () => {
  let service: WeblateTranslationsService;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeblateTranslationsService,
        {
          provide: WeblateClientService,
          useValue: { getClient: jest.fn().mockReturnValue(mockClient) },
        },
      ],
    }).compile();

    service = module.get<WeblateTranslationsService>(
      WeblateTranslationsService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTranslationUnit', () => {
    it('should create a monolingual unit with key and value', async () => {
      const mockUnit = {
        id: 42,
        context: '',
        source: ['Hello'],
        target: [],
        web_url:
          'https://weblate.example.com/translate/my-project/my-component/en/?checksum=abc123',
      };

      jest
        .spyOn(sdk, 'translationsUnitsCreate')
        .mockResolvedValue({ data: mockUnit, error: undefined } as any);

      const result = await service.createTranslationUnit(
        'my-project',
        'my-component',
        'en',
        { key: 'greeting', value: ['Hello'] },
      );

      expect(result).toEqual(mockUnit);
      expect(sdk.translationsUnitsCreate).toHaveBeenCalledWith({
        client: mockClient,
        path: {
          component__project__slug: 'my-project',
          component__slug: 'my-component',
          language__code: 'en',
        },
        body: { key: 'greeting', value: ['Hello'] },
      });
    });

    it('should create a bilingual unit with context, source, and target', async () => {
      const mockUnit = {
        id: 43,
        context: 'greeting_message',
        source: ['Hello'],
        target: ['Hola'],
        web_url:
          'https://weblate.example.com/translate/my-project/my-component/es/?checksum=def456',
      };

      jest
        .spyOn(sdk, 'translationsUnitsCreate')
        .mockResolvedValue({ data: mockUnit, error: undefined } as any);

      const result = await service.createTranslationUnit(
        'my-project',
        'my-component',
        'es',
        { context: 'greeting_message', source: ['Hello'], target: ['Hola'] },
      );

      expect(result).toEqual(mockUnit);
      expect(sdk.translationsUnitsCreate).toHaveBeenCalledWith({
        client: mockClient,
        path: {
          component__project__slug: 'my-project',
          component__slug: 'my-component',
          language__code: 'es',
        },
        body: {
          context: 'greeting_message',
          source: ['Hello'],
          target: ['Hola'],
        },
      });
    });

    it('should pass state parameter when provided', async () => {
      const mockUnit = { id: 44, context: '', source: ['Hi'], target: [] };

      jest
        .spyOn(sdk, 'translationsUnitsCreate')
        .mockResolvedValue({ data: mockUnit, error: undefined } as any);

      await service.createTranslationUnit('proj', 'comp', 'en', {
        key: 'hi',
        value: ['Hi'],
        state: 20,
      });

      expect(sdk.translationsUnitsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { key: 'hi', value: ['Hi'], state: 20 },
        }),
      );
    });

    it('should throw on API error response', async () => {
      jest.spyOn(sdk, 'translationsUnitsCreate').mockResolvedValue({
        data: undefined,
        error: { detail: 'Not found' },
      } as any);

      await expect(
        service.createTranslationUnit('proj', 'comp', 'en', {
          key: 'test',
          value: ['Test'],
        }),
      ).rejects.toThrow('Failed to create translation unit');
    });

    it('should throw on network error', async () => {
      jest
        .spyOn(sdk, 'translationsUnitsCreate')
        .mockRejectedValue(new Error('Network error'));

      await expect(
        service.createTranslationUnit('proj', 'comp', 'en', {
          key: 'test',
          value: ['Test'],
        }),
      ).rejects.toThrow('Failed to create translation unit');
    });
  });

  describe('getTranslationByKey', () => {
    it('should query with the exact-match operator, not a substring search', async () => {
      jest
        .spyOn(sdk, 'unitsList')
        .mockResolvedValue({ data: { results: [], count: 0 }, error: undefined } as any);

      await service.getTranslationByKey('proj', 'comp', 'en', 'UNSAVEDCHANGES');

      const q = (sdk.unitsList as jest.Mock).mock.calls[0][0].query.q as string;
      expect(q).toContain('context:="UNSAVEDCHANGES"');
    });

    it('should not return a prefix unit that only contains the key', async () => {
      jest.spyOn(sdk, 'unitsList').mockResolvedValue({
        data: {
          results: [{ id: 1, context: 'UNSAVEDCHANGESWILLBELOST' }],
          count: 1,
        },
        error: undefined,
      } as any);

      const result = await service.getTranslationByKey(
        'proj',
        'comp',
        'en',
        'UNSAVEDCHANGES',
      );

      expect(result).toBeNull();
    });

    it('should return the unit whose context matches exactly', async () => {
      const unit = { id: 7, context: 'UNSAVEDCHANGES', target: ['x'] };
      jest.spyOn(sdk, 'unitsList').mockResolvedValue({
        data: { results: [unit], count: 1 },
        error: undefined,
      } as any);

      const result = await service.getTranslationByKey(
        'proj',
        'comp',
        'en',
        'UNSAVEDCHANGES',
      );

      expect(result).toEqual(unit);
    });

    it('should fail on ambiguity when more than one unit matches the key', async () => {
      jest.spyOn(sdk, 'unitsList').mockResolvedValue({
        data: {
          results: [
            { id: 1, context: 'DUP' },
            { id: 2, context: 'DUP' },
          ],
          count: 2,
        },
        error: undefined,
      } as any);

      await expect(
        service.getTranslationByKey('proj', 'comp', 'en', 'DUP'),
      ).rejects.toThrow('Ambiguous key "DUP"');
    });
  });

  describe('writeTranslation', () => {
    it('should return identity fields even when the PATCH response omits them', async () => {
      jest.spyOn(sdk, 'unitsList').mockResolvedValue({
        data: {
          results: [{ id: 99, context: 'GREETING', source: ['Hello'] }],
          count: 1,
        },
        error: undefined,
      } as any);
      // PATCH response body lacks id/context, as the real Weblate API returns.
      jest.spyOn(sdk, 'unitsPartialUpdate').mockResolvedValue({
        data: { target: ['Hola'], state: 20, translated: true },
        error: undefined,
      } as any);

      const result = await service.writeTranslation(
        'proj',
        'comp',
        'es',
        'GREETING',
        'Hola',
      );

      expect(result).toMatchObject({
        id: 99,
        context: 'GREETING',
        target: ['Hola'],
        translated: true,
      });
    });
  });
});
