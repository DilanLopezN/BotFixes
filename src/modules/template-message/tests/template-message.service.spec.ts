import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateMessageSchema, TemplateStatus } from '../schema/template-message.schema';
import { TemplateMessageHistorySchema } from '../schema/template-message-history.schema';
import { TemplateMessageService } from '../services/template-message.service';
import { TemplateMessageHistoryService } from '../services/template-message-history.service';
import { CacheModule } from '../../_core/cache/cache.module';
import { StorageService } from '../../storage/storage.service';
import { ExternalDataService } from '../services/external-data.service';
import { ExternalDataMockService } from './mocks/external-data-mock.service';
import { TemplateCategory } from '../../channels/gupshup/services/partner-api.service';
import mongoose from 'mongoose';
describe('MODULE: template-message', () => {
    let moduleRef: TestingModule;
    let templateMessageService: TemplateMessageService;
    let externalDataMockService: ExternalDataMockService;
    const validTemplateVariables = [
        { name: 'firstName', value: 'firstName', label: 'firstName', type: 'name', sampleValue: 'Joe', required: true },
        { name: 'lastName', value: 'lastName', label: 'lastName', type: 'name', sampleValue: 'Doe', required: true },
    ];

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot(process.env.MONGO_URI_TESTS || 'mongodb://localhost:27017/kissbot-api-tests', {
                    useNewUrlParser: true,
                    useUnifiedTopology: false,
                    ...(process.env.NODE_ENV === 'local'
                        ? {}
                        : {
                            retryWrites: true,
                            w: 'majority',
                        }),
                }),
                MongooseModule.forFeature([
                    { name: 'TemplateMessage', schema: TemplateMessageSchema },
                    { name: 'TemplateMessageHistory', schema: TemplateMessageHistorySchema },
                ]),
                CacheModule,
            ],
            providers: [
                TemplateMessageService,
                TemplateMessageHistoryService,
                {
                    useClass: ExternalDataMockService,
                    provide: ExternalDataService
                },
                {
                    useValue: {},
                    provide: StorageService,
                },
            ],
            exports: []
        }).compile();
        templateMessageService = moduleRef.get<TemplateMessageService>(TemplateMessageService);
        externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);

    });

    describe('SERVICE: TemplateMessageService', () => {
        it('FUNCTION: validationVariables DESC:should return valid message template when all variables are defined', () => {
            const message = 'Hello {{firstName}}, your last name is {{lastName}}. thank you for informations!';
            const result = templateMessageService.validationVariables(message, validTemplateVariables);
            expect(result.validMessageTemplate).toBe(true);
            expect(result.variableEmpty).toBe(false);
        });

        it('FUNCTION: validationVariables DESC:should return invalid message template when a variable is not defined', () => {
            const message = 'Hello {{firstName}}, your last name is {{lastName}}. Your age is {{age}}.';
            const result = templateMessageService.validationVariables(message, validTemplateVariables);
            expect(result.validMessageTemplate).toBe(false);
            expect(result.variableEmpty).toBe(true);
        });

        it('FUNCTION: validationVariables DESC:should return invalid message template when a variable is empty', () => {
            const message = 'Hello {{firstName}}, your last name is {{}}.';
            const result = templateMessageService.validationVariables(message, validTemplateVariables);
            expect(result.validMessageTemplate).toBe(false);
            expect(result.variableEmpty).toBe(true);
        });

        it('FUNCTION: validationVariables DESC:should return invalid message template when a variable is too close to the beginning of the message', () => {
            const message = '{{firstName}}, your last name is {{lastName}}. Thank you!';
            const result = templateMessageService.validationVariables(message, validTemplateVariables);
            expect(result.validMessageTemplate).toBe(false);
            expect(result.variableEmpty).toBe(false);
        });

        it('FUNCTION: validationVariables DESC:should return invalid message template when a variable is too close to the end of the message', () => {
            const message = 'Hello {{firstName}}, your last name is {{lastName}}?';
            const result = templateMessageService.validationVariables(message, validTemplateVariables);
            expect(result.validMessageTemplate).toBe(false);
            expect(result.variableEmpty).toBe(false);
        });

        it('FUNCTION: getAppNamesTemplateHsm DESC: deve retornar templateAppNames e templateChannelConfigs como arrays vazios', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const channel1 = new mongoose.Types.ObjectId().toString();;
            const channel2 = new mongoose.Types.ObjectId().toString();;

            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([]))
            const result = await templateMessageService.getAppNamesTemplateHsm(workspaceId, [
                channel1, channel2,
            ]);

            expect(result.templateAppNames).toStrictEqual([])
            expect(result.templateChannelConfigs).toStrictEqual([])
        });

        it('FUNCTION: getAppNamesTemplateHsm DESC: deve retornar templateAppNames e templateChannelConfigs com 1 item cada', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const channel1 = new mongoose.Types.ObjectId().toString();;
            const channel2 = new mongoose.Types.ObjectId().toString();;
            const appName1 = new mongoose.Types.ObjectId().toString();;
            const appName2 = new mongoose.Types.ObjectId().toString();;
            const apikey = new mongoose.Types.ObjectId().toString();;

            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([{
                enable: true,
                configData: {
                    appName: appName1,
                    apikey,
                },
                _id: channel1,
            },
            {
                enable: true,
                configData: {
                    appName: appName2,
                    apikey,
                },
                _id: channel2,
            }] as any[]))
            const result = await templateMessageService.getAppNamesTemplateHsm(workspaceId, [
                channel1
            ]);

            expect(result.templateAppNames?.[0]).toBe(appName1)
            expect(result.templateChannelConfigs?.[0]).toBe(channel1)
        });

        it('FUNCTION: getAppNamesTemplateHsm DESC: deve retornar templateAppNames e templateChannelConfigs com 2 items cada', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const channel1 = new mongoose.Types.ObjectId().toString();;
            const channel2 = new mongoose.Types.ObjectId().toString();;
            const appName1 = new mongoose.Types.ObjectId().toString();;
            const appName2 = new mongoose.Types.ObjectId().toString();;
            const apikey = new mongoose.Types.ObjectId().toString();;

            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([{
                enable: true,
                configData: {
                    appName: appName1,
                    apikey,
                },
                _id: channel1,
            },
            {
                enable: true,
                configData: {
                    appName: appName2,
                    apikey,
                },
                _id: channel2,
            }] as any[]))
            const result = await templateMessageService.getAppNamesTemplateHsm(workspaceId, [
                channel1, channel2
            ]);


            expect(!!(result.templateAppNames?.find(app => app == appName1))).toBe(true)
            expect(!!(result.templateChannelConfigs?.find(channel => channel == channel1))).toBe(true)

            expect(!!(result.templateAppNames?.find(app => app == appName2))).toBe(true)
            expect(!!(result.templateChannelConfigs?.find(channel => channel == channel2))).toBe(true)
        });

        it('FUNCTION: getAppNamesTemplateHsm DESC: deve retornar templateAppNames e templateChannelConfigs com 2 items cada passando o parametro channels vazio', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const channel1 = new mongoose.Types.ObjectId().toString();;
            const channel2 = new mongoose.Types.ObjectId().toString();;
            const appName1 = new mongoose.Types.ObjectId().toString();;
            const appName2 = new mongoose.Types.ObjectId().toString();;
            const apikey = new mongoose.Types.ObjectId().toString();;

            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([{
                enable: true,
                configData: {
                    appName: appName1,
                    apikey,
                },
                _id: channel1,
            },
            {
                enable: true,
                configData: {
                    appName: appName2,
                    apikey,
                },
                _id: channel2,
            }] as any[]))
            const result = await templateMessageService.getAppNamesTemplateHsm(workspaceId, []);

            expect(!!(result.templateAppNames?.find(app => app == appName1))).toBe(true)
            expect(!!(result.templateChannelConfigs?.find(channel => channel == channel1))).toBe(true)

            expect(!!(result.templateAppNames?.find(app => app == appName2))).toBe(true)
            expect(!!(result.templateChannelConfigs?.find(channel => channel == channel2))).toBe(true)
        });
        
        it('FUNCTION: _create DESC: Max length hsm validation exception', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const userId = new mongoose.Types.ObjectId().toString();;

            try {
                await templateMessageService._create(
                    {
                        isHsm: true,
                        active: true,
                        message: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam commodo feugiat diam. Proin vel egestas sapien. Mauris vitae ligula at quam aliquet tempor. Nullam facilisis sapien turpis, eu porta nisl lobortis sit amet. Nulla cursus vitae risus nec consequat. Nam a nulla ut risus porttitor commodo at non velit. Nam efficitur, turpis at rutrum tincidunt, eros libero ullamcorper tellus, feugiat rhoncus nisi nulla non erat. Donec ultricies, justo eu dignissim bibendum, orci leo dapibus mauris, nec consectetur nisl eros ut nulla. Aliquam feugiat fringilla ipsum, in luctus lacus mattis non. Morbi nec nulla vel orci molestie vestibulum ultrices vel quam. Aliquam erat volutpat. Nunc vulputate non ex vel rhoncus. Sed accumsan bibendum massa, vel porta est iaculis vel. Pellentesque fermentum lobortis ligula tristique blandit. Donec et arcu ac lectus interdum commodo quis ac ante. Praesent sed dictum purus. Integer vestibulum tristique velit, nec molestie eros placerat eu. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut sodales sapien et libero accumsan mattis.`,
                        name: "Teste",
                        userId,
                        workspaceId,
                        tags: [],
                        teams: [],
                        channels: [],
                        variables: [],
                        category: TemplateCategory.UTILITY
                    }, {} as any
                )
            } catch (e) {
                expect(e.message).toBe('template message length exceed');
            }
        });

        it('FUNCTION: _create DESC: template message invalid', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const userId = new mongoose.Types.ObjectId().toString();;

            try {
                await templateMessageService._create(
                    {
                        isHsm: true,
                        active: true,
                        message: `Oi {{paciente}}Lorem ipsum dolor sit amet.`,
                        name: "Teste",
                        userId,
                        workspaceId,
                        tags: [],
                        teams: [],
                        channels: [],
                        variables: [{"label":"paciente","required":true,"type":"@sys.text","value":"paciente","sampleValue":"José"}],
                        category: TemplateCategory.UTILITY
                    }, {} as any
                )
            } catch (e) {
                expect(e.message).toBe('template message invalid');
            }
        });

        it('FUNCTION: _create DESC: Template variable empty', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const userId = new mongoose.Types.ObjectId().toString();;

            try {
                await templateMessageService._create(
                    {
                        isHsm: true,
                        active: true,
                        message: `Oi Sr(a). {{paciente}}Lorem ipsum dolor sit amet.`,
                        name: "Teste",
                        userId,
                        workspaceId,
                        tags: [],
                        teams: [],
                        channels: [],
                        variables: [],
                        category: TemplateCategory.UTILITY
                    }, {} as any
                )
            } catch (e) {
                expect(e.message).toBe('template variables invalid');
            }
        });

        it('FUNCTION: _create DESC: template channel appName not found', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();
            const userId = new mongoose.Types.ObjectId().toString();

            try {
                jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([]))
                await templateMessageService._create(
                    {
                        isHsm: true,
                        active: true,
                        message: `Oi Sr(a).Lorem ipsum dolor sit amet.`,
                        name: "Teste",
                        userId,
                        workspaceId,
                        tags: [],
                        teams: [],
                        channels: [],
                        variables: [],
                        category: TemplateCategory.UTILITY
                    }, {} as any
                )
            } catch (e) {
                expect(e.message).toBe('template channel appName not found');
            }
        });


        it('FUNCTION: _create DESC: Deve criar template no gupshup e no banco mas com resposta negativa do gupshup, wabaTemplateId deve ser nulo', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const userId = new mongoose.Types.ObjectId().toString();
            const channel = new mongoose.Types.ObjectId().toString();
            const appName = new mongoose.Types.ObjectId().toString();
            const apikey = new mongoose.Types.ObjectId().toString();
            const gupshupId = new mongoose.Types.ObjectId().toString();
            const rejectedReason = 'REJEITADO';

            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([{
                enable: true,
                configData: {
                    appName: appName,
                    apikey,
                },
                _id: channel,
            }] as any[]))

            jest.spyOn(externalDataMockService, 'createTemplateGupshup').mockImplementation(() => Promise.resolve({
                channelConfigId: channel,
                appName,
                template: {
                    id: gupshupId
                },
                category: TemplateCategory.UTILITY,
                status: 'error',
                message: rejectedReason
            } as any))

            const created = await templateMessageService._create(
                {
                    isHsm: true,
                    active: true,
                    message: `Oi Sr(a).Lorem ipsum dolor sit amet.`,
                    name: "Teste",
                    userId,
                    workspaceId,
                    tags: [],
                    teams: [],
                    channels: [],
                    variables: [],
                    category: TemplateCategory.UTILITY
                }, {} as any
            )
            expect(created?.wabaResult?.[channel]?.wabaTemplateId).toBeFalsy();
            expect(created?.wabaResult?.[channel]?.category).toBe(TemplateCategory.UTILITY);
            expect(created?.wabaResult?.[channel]?.channelConfigId).toBe(channel);
            expect(created?.wabaResult?.[channel]?.appName).toBe(appName);
            expect(created?.wabaResult?.[channel]?.status).toBe(TemplateStatus.ERROR_ONSUBMIT);
            expect(created?.wabaResult?.[channel]?.rejectedReason).toBe(rejectedReason);
        });

        it('FUNCTION: _create/getParsedTemplate DESC: Deve criar template no gupshup e no banco e usar a função getParsedTemplate pra substituir as variáveis', async () => {
            const workspaceId = new mongoose.Types.ObjectId().toString();;
            const userId = new mongoose.Types.ObjectId().toString();
            const channel = new mongoose.Types.ObjectId().toString();
            const appName = new mongoose.Types.ObjectId().toString();
            const apikey = new mongoose.Types.ObjectId().toString();
            const gupshupId = new mongoose.Types.ObjectId().toString();


            jest.spyOn(externalDataMockService, 'getChannelConfigByWorkspaceIdAndGupshup').mockImplementation(() => Promise.resolve([{
                enable: true,
                configData: {
                    appName: appName,
                    apikey,
                },
                _id: channel,
            }] as any[]))

            jest.spyOn(externalDataMockService, 'createTemplateGupshup').mockImplementation(() => Promise.resolve({
                channelConfigId: channel,
                appName,
                template: {
                    id: gupshupId
                },
                category: TemplateCategory.UTILITY,
                status: 'success',
            } as any))

            const created = await templateMessageService._create(
                {
                    isHsm: true,
                    active: true,
                    message: `Lorem {{agent.name}} ipsum {{var1}} dolor sit amet.`,
                    name: "Teste",
                    userId,
                    workspaceId,
                    tags: [],
                    teams: [],
                    channels: [],
                    variables: [
                        {
                            "value": "var1",
                            "label": "var1",
                            "type": "@sys.text",
                            "required": true,
                            "sampleValue": "VARIAVEL 1",
                        }
                    ],
                    category: TemplateCategory.UTILITY
                }, {} as any
            )
            expect(created?.wabaResult?.[channel]?.wabaTemplateId).toBe(gupshupId);
            expect(created?.wabaResult?.[channel]?.category).toBe(TemplateCategory.UTILITY);
            expect(created?.wabaResult?.[channel]?.channelConfigId).toBe(channel);
            expect(created?.wabaResult?.[channel]?.appName).toBe(appName);
            expect(created?.wabaResult?.[channel]?.status).toBe(TemplateStatus.AWAITING_APPROVAL);

            const r = await templateMessageService.getParsedTemplate(created._id, [
                {key: 'agent.name', value: 'AGENTE'},
                {key: 'var1', value: 'VARIAVEL_1'},
            ]);

            expect(r).toBe('Lorem AGENTE ipsum VARIAVEL_1 dolor sit amet.')
        });

    });
});
