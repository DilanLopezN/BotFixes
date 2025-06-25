import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { InteractionsService } from '../services/interactions.service';
import { Interaction } from '../interfaces/interaction.interface';
import { InteractionType } from '../interfaces/response.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionSchema } from '../schemas/interaction.schema';
import { InteractionSharedService } from '../services/interactionShared.service';
import { CacheModule } from '../../_core/cache/cache.module';
import { ExternalDataMockService } from './mocks/external-data-mock.service';
import { ExternalDataService } from '../services/external-data.service';

describe('MODULE: Interactions', () => {
    let moduleRef: TestingModule;
    let interactionSharedService: InteractionSharedService;
    let externalDataMockService: ExternalDataMockService;

    const workspaceId = v4();
    const botId = v4();
    const id1 = v4();
    const id2 = v4();
    const id3 = v4();
    const id4 = v4();
    const id5 = v4();
    const id6 = v4();
    const id7 = v4();

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot(
                    process.env.MONGO_URI_TESTS || 'mongodb://localhost:27017/kissbot-api',
                    {
                        useNewUrlParser: true,
                        useUnifiedTopology: false,
                    },
                ),
                MongooseModule.forFeature([{ name: 'Interaction', schema: InteractionSchema }]),
                CacheModule,
            ],
            providers: [
                InteractionSharedService,
                {
                    useClass: ExternalDataMockService,
                    provide: ExternalDataService,
                },
            ],
        }).compile();
        interactionSharedService = moduleRef.get<InteractionSharedService>(InteractionSharedService);
        externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);
    });

    describe('SERVICE: InteractionsSharedService', () => {
        it('FUNCTION: checkValidIntentContextInteraction 1', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages3 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            try {
                await interactionSharedService.checkValidIntentContextInteraction(interaction2, interactions);
            } catch (e) {
                // Valida se ocorreu o erro especifico ao quando não existe nenhuma intents encontrada no workspace
                expect(e.response.error).toBe('ERROR_INTENT_NOT_FOUND');
                expect(e.response.message).toBe('error intent not found in workspace');
                expect(e.status).toBe(400);
            }
        });

        it('FUNCTION: checkValidIntentContextInteraction 2', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];

            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages2 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            const result = await interactionSharedService.checkValidIntentContextInteraction(
                interaction as unknown as Interaction,
                interactions,
            );

            // deve retornar undefined pois currInteraction não possui intents
            expect(result).toStrictEqual(undefined);
        });

        it('FUNCTION: checkValidIntentContextInteraction 3', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste11',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'], // nome invalido de intent deveria ser 'Teste11'
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];

            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages2 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            try {
                await interactionSharedService.checkValidIntentContextInteraction(interaction2, interactions);
            } catch (e) {
                // Valida se ocorreu o erro especifico quando encontra a intent invalida do currInteraction
                expect(e.response.error).toBe('ERROR_INTENT_NOT_FOUND');
                expect(e.response.message).toBe('error intent not found in workspace');
                expect(e.status).toBe(400);
            }
        });

        it('FUNCTION: checkValidIntentContextInteraction 4', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            const result = await interactionSharedService.checkValidIntentContextInteraction(
                interaction2,
                interactions,
            );

            // deve retornar undefined pois currInteraction é unico com intents
            expect(result).toStrictEqual(undefined);
        });

        it('FUNCTION: checkValidIntentContextInteraction 5', async () => {
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages3 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];
            const result = await interactionSharedService.checkValidIntentContextInteraction(
                interaction2,
                interactions,
            );

            // deve retornar undefined pois intents são diferentes nas interactions
            expect(result).toStrictEqual(undefined);
        });

        it('FUNCTION: checkValidIntentContextInteraction 6', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2', 'Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages3 },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];
            try {
                await interactionSharedService.checkValidIntentContextInteraction(interaction2 as any, interactions);
            } catch (error) {
                // Valida se ocorreu o erro especifico quando encontra uma interaction que possui a mesma intent que deve ser unica no bot
                expect(error.response.error).toBe('ERROR_DUPLICATED_UNIQUE_INTENT');
                expect(error.response.message[0]).toStrictEqual(interactions[3]._id);
                expect(error.status).toBe(400);
            }
        });

        it('FUNCTION: checkValidIntentContextInteraction 7', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2', 'Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages3, parentId: id6, path: [id6] },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6 },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];
            const result = await interactionSharedService.checkValidIntentContextInteraction(
                interaction2 as any,
                interactions,
            );

            // deve retornar undefined pois a interaction que possui a mesma intent esta em outro contexto
            expect(result).toStrictEqual(undefined);
        });

        it('FUNCTION: checkValidIntentContextInteraction 8', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2', 'Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3 },
                { ...interaction, _id: id4, languages: languages3, parentId: id6, path: [id6] },
                { ...interaction, _id: id5 },
                { ...interaction, _id: id6, type: InteractionType.container },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            try {
                await interactionSharedService.checkValidIntentContextInteraction(interaction2 as any, interactions);
            } catch (error) {
                // Valida se ocorreu o erro especifico quando encontra uma interaction que possui a mesma intent e esta no mesmo contexto
                expect(error.response.error).toBe('ERROR_DUPLICATED_INTENT_IN_CONTEXT');
                expect(error.response.message[0]).toStrictEqual(interactions[3]._id);
                expect(error.status).toBe(400);
            }
        });

        it('FUNCTION: checkValidIntentContextInteraction 9', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2', 'Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3, type: InteractionType.container },
                { ...interaction, _id: id4, languages: languages3, parentId: id6, path: [id3, id5, id6] },
                { ...interaction, _id: id5, type: InteractionType.container, parentId: id3, path: [id3] },
                { ...interaction, _id: id6, type: InteractionType.container, parentId: id5, path: [id3, id5] },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];

            try {
                await interactionSharedService.checkValidIntentContextInteraction(interaction2 as any, interactions);
            } catch (error) {
                // Valida se ocorreu o erro especifico quando encontra uma interaction que possui a mesma intent e esta no mesmo contexto
                expect(error.response.error).toBe('ERROR_DUPLICATED_INTENT_IN_CONTEXT');
                expect(error.response.message[0]).toStrictEqual(interactions[3]._id);
                expect(error.status).toBe(400);
            }
        });

        it('FUNCTION: checkValidIntentContextInteraction 10', async () => {
            jest.spyOn(externalDataMockService, 'getIntentsByWorkspaceIdAndBotId').mockImplementation(() =>
                Promise.resolve([
                    {
                        name: 'Teste1',
                        label: 'teste1',
                        attributes: [
                            {
                                label: '1',
                                name: '1',
                                value: '1',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                    {
                        name: 'Teste2',
                        label: 'teste2',
                        attributes: [
                            {
                                label: '2',
                                name: '2',
                                value: '2',
                            },
                        ],
                        canDuplicateContext: true,
                    },
                ]),
            );
            const languages: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages2: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const languages3: any = [
                {
                    language: 'pt-BR',
                    responses: [],
                    userSays: [],
                    intents: ['Teste2', 'Teste1'],
                },
                {
                    language: 'en',
                    responses: [],
                    userSays: [],
                },
                {
                    language: 'es',
                    responses: [],
                    userSays: [],
                },
            ];
            const interaction: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };
            const interaction2: any = {
                _id: id2,
                name: 'aa',
                isCollapsed: false,
                botId,
                workspaceId,
                comments: [],
                path: [],
                parentId: null,
                languages: languages2,
                type: InteractionType.interaction,
                action: '',
                triggers: [],
            };

            const interactions: Interaction[] = [
                { ...interaction, _id: id1, type: InteractionType.welcome },
                { ...interaction2 },
                { ...interaction, _id: id3, type: InteractionType.container },
                { ...interaction, _id: id4, languages: languages3, parentId: id6, path: [id3, id5, id6] },
                { ...interaction, _id: id5, type: InteractionType.interaction, parentId: id3, path: [id3] },
                { ...interaction, _id: id6, type: InteractionType.container, parentId: id5, path: [id3, id5] },
                { ...interaction, _id: id7, type: InteractionType.fallback },
            ];
            const result = await interactionSharedService.checkValidIntentContextInteraction(
                interaction2 as any,
                interactions,
            );

            // deve retornar undefined pois a proxima interaction que possui intents esta num contexto diferente
            expect(result).toStrictEqual(undefined);
        });
    });
});
