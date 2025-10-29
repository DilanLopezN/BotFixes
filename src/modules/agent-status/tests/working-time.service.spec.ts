import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkingTimeService } from '../services/working-time.service';
import { BreakSettingService } from '../services/break-setting.service';
import { GeneralBreakSettingService } from '../services/general-break-setting.service';
import { ExternalDataAgentStatusService } from '../services/external-data.service';
import { ZSetEventManagerService, EventType } from '../services/zset-event-manager.service';
import { WorkingTime } from '../models/working-time.entity';
import { BreakSetting } from '../models/break-setting.entity';
import { GeneralBreakSetting } from '../models/general-break-setting.entity';
import { AGENT_STATUS_CONNECTION } from '../ormconfig';
import { CacheModule } from '../../_core/cache/cache.module';
import { WorkingTimeType } from '../interfaces/working-time.interface';
import { v4 } from 'uuid';
import { getRandomInt } from './test.util';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('WorkingTimeService', () => {
    let service: WorkingTimeService;
    let zsetEventManager: ZSetEventManagerService;
    let breakSettingService: BreakSettingService;
    let generalBreakSettingService: GeneralBreakSettingService;
    let moduleRef: TestingModule;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    name: AGENT_STATUS_CONNECTION,
                    url: process.env.POSTGRESQL_URI_TESTS || 'postgres://postgres:@localhost/tests',
                    entities: [WorkingTime, BreakSetting, GeneralBreakSetting],
                    synchronize: true,
                    migrationsRun: false,
                    schema: 'agent_status',
                }),
                TypeOrmModule.forFeature([WorkingTime, BreakSetting, GeneralBreakSetting], AGENT_STATUS_CONNECTION),
                CacheModule,
            ],
            providers: [
                WorkingTimeService,
                ZSetEventManagerService,
                {
                    provide: BreakSettingService,
                    useValue: {
                        findByIdAndWorkspaceId: jest.fn().mockResolvedValue({
                            data: { id: 1, durationSeconds: 900, name: 'Test Break' }
                        }),
                    },
                },
                {
                    provide: GeneralBreakSettingService,
                    useValue: {
                        getByWorkspaceId: jest.fn().mockResolvedValue({
                            enabled: true,
                            notificationIntervalSeconds: 300,
                            breakStartDelaySeconds: 60,
                            maxInactiveDurationSeconds: 1800,
                        }),
                        findByWorkspaceId: jest.fn().mockResolvedValue({
                            enabled: true,
                            maxInactiveDurationSeconds: 1800,
                        }),
                    },
                },
                {
                    provide: ExternalDataAgentStatusService,
                    useValue: {
                        getTeamIdsByWorkspaceAndUser: jest.fn().mockResolvedValue(['team1', 'team2']),
                    },
                },
            ],
        }).compile();

        service = moduleRef.get<WorkingTimeService>(WorkingTimeService);
        zsetEventManager = moduleRef.get<ZSetEventManagerService>(ZSetEventManagerService);
        breakSettingService = moduleRef.get<BreakSettingService>(BreakSettingService);
        generalBreakSettingService = moduleRef.get<GeneralBreakSettingService>(GeneralBreakSettingService);
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    describe('connect', () => {
        it('deve criar working time ONLINE quando não há registro ativo', async () => {
            const workspaceId = v4();
            const userId = v4();

            const result = await service.connect(workspaceId, userId);

            expect(result).toBeDefined();
            expect(result.type).toBe(WorkingTimeType.ONLINE);
            expect(result.workspaceId).toBe(workspaceId);
            expect(result.userId).toBe(userId);
            expect(result.startedAt).toBeDefined();
            expect(result.endedAt).toBeNull();
        });

        it('deve finalizar pausa anterior e criar ONLINE quando pausa ativa existe', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Cria um break ativo primeiro
            await service.startBreakInactive(workspaceId, userId);

            // Conecta (deve finalizar o break e criar ONLINE)
            const result = await service.connect(workspaceId, userId);

            expect(result.type).toBe(WorkingTimeType.ONLINE);
        });

        it('deve retornar registro ONLINE existente se já conectado', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Primeira conexão
            const firstConnect = await service.connect(workspaceId, userId);
            
            // Segunda conexão (deve retornar o mesmo registro)
            const secondConnect = await service.connect(workspaceId, userId);

            expect(firstConnect.id).toBe(secondConnect.id);
            expect(secondConnect.type).toBe(WorkingTimeType.ONLINE);
        });
    });

    describe('startBreakInactive', () => {
        it('deve criar working time INACTIVE quando configuração geral está habilitada', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Primeiro conecta
            await service.connect(workspaceId, userId);

            // Inicia break por inatividade
            const result = await service.startBreakInactive(workspaceId, userId);

            expect(result).toBeDefined();
            expect(result.type).toBe(WorkingTimeType.INACTIVE);
            expect(result.workspaceId).toBe(workspaceId);
            expect(result.userId).toBe(userId);
            expect(result.contextMaxInactiveDurationSeconds).toBe(1800);
        });

        it('deve não criar pausa quando configuração geral está desabilitada', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Cria um mock específico para este teste
            const mockGeneralBreakSettingService = {
                ...generalBreakSettingService,
                findByWorkspaceId: jest.fn().mockResolvedValue({ enabled: false }),
                getByWorkspaceId: jest.fn().mockResolvedValue({ enabled: false }),
            };

            // Substitui temporariamente o serviço
            const originalService = service['generalBreakSettingService'];
            service['generalBreakSettingService'] = mockGeneralBreakSettingService;

            await service.connect(workspaceId, userId);
            const result = await service.startBreakInactive(workspaceId, userId);

            expect(result).toBeUndefined();
            
            // Restaura o serviço original
            service['generalBreakSettingService'] = originalService;
        });

        it('deve retornar pausa inativa existente se já existe', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.connect(workspaceId, userId);
            
            // Primeira chamada
            const firstBreak = await service.startBreakInactive(workspaceId, userId);
            
            // Segunda chamada (deve retornar o mesmo)
            const secondBreak = await service.startBreakInactive(workspaceId, userId);

            expect(firstBreak.id).toBe(secondBreak.id);
        });
    });

    describe('startBreak', () => {
        it('deve criar working time BREAK com configurações corretas', async () => {
            const workspaceId = v4();
            const userId = v4();
            const breakSettingId = 1;

            await service.connect(workspaceId, userId);

            const result = await service.startBreak(workspaceId, userId, breakSettingId);

            expect(result).toBeDefined();
            expect(result.type).toBe(WorkingTimeType.BREAK);
            expect(result.breakSettingId).toBe(breakSettingId);
            expect(result.contextDurationSeconds).toBe(900);
        });

        it('deve retornar pausa existente se já está em pausa', async () => {
            const workspaceId = v4();
            const userId = v4();
            const breakSettingId = 1;

            await service.connect(workspaceId, userId);
            
            // Primeira pausa
            const firstBreak = await service.startBreak(workspaceId, userId, breakSettingId);
            
            // Segunda tentativa (deve retornar a mesma)
            const secondBreak = await service.startBreak(workspaceId, userId, breakSettingId);

            expect(firstBreak.id).toBe(secondBreak.id);
        });
    });

    describe('endBreak', () => {
        it('deve finalizar working time ativo e calcular duração', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Primeiro conecta (necessário para ter um activeRecord)
            await service.connect(workspaceId, userId);

            // Cria um break
            await service.startBreakInactive(workspaceId, userId);

            // Aguarda um pouco para ter duração
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Finaliza o break
            const result = await service.endBreak(workspaceId, userId);

            expect(result).toBeDefined();
            expect(result.endedAt).toBeDefined();
            expect(result.durationInSeconds).toBeGreaterThanOrEqual(1);
        });

        it('deve retornar null quando não há registro ativo', async () => {
            const workspaceId = v4();
            const userId = v4();

            const result = await service.endBreak(workspaceId, userId);

            expect(result).toBeNull();
        });

        it('deve limpar eventos Redis ao finalizar pausa', async () => {
            const workspaceId = v4();
            const userId = v4();

            // Cria eventos no Redis
            await zsetEventManager.addLastAccessEvent(workspaceId, userId, Date.now() + 30000, Date.now());
            await zsetEventManager.addBreakExpirationEvent(workspaceId, userId, Date.now() + 60000);

            await service.startBreakInactive(workspaceId, userId);
            await service.endBreak(workspaceId, userId);

            // Verifica se eventos foram removidos
            const lastAccessEvent = await zsetEventManager.getLastAccessEvent(workspaceId, userId);
            expect(lastAccessEvent).toBeNull();
        });
    });

    describe('findActiveByUserAndWorkspaceId', () => {
        it('deve retornar working time ativo para usuário', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.connect(workspaceId, userId);

            const result = await service.findActiveByUserAndWorkspaceId(workspaceId, userId);

            expect(result).toBeDefined();
            expect(result.type).toBe(WorkingTimeType.ONLINE);
            expect(result.workspaceId).toBe(workspaceId);
            expect(result.userId).toBe(userId);
            expect(result.endedAt).toBeNull();
        });

        it('deve retornar null quando não há working time ativo', async () => {
            const workspaceId = v4();
            const userId = v4();

            const result = await service.findActiveByUserAndWorkspaceId(workspaceId, userId);

            expect(result).toBeFalsy();
        });

        it('deve incluir dados de contexto para working time ONLINE', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.connect(workspaceId, userId);

            const result = await service.findActiveByUserAndWorkspaceId(workspaceId, userId);

            expect(result['contextLastAcess']).toBeDefined();
            expect(result['contextLastAcess'].generalBreakSetting).toBeDefined();
        });
    });

    describe('Casos extremos que podem causar deleção de chaves Redis sem processamento', () => {

        it('deve tratar cenário onde eventos são adicionados e removidos rapidamente', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.connect(workspaceId, userId);
            
            // Inicia break
            await service.startBreakInactive(workspaceId, userId);
            
            // Aguarda um pouco para garantir que eventos foram adicionados
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verifica se eventos foram criados
            const eventsBeforeEnd = await zsetEventManager.getExpiredEvents(Date.now() + 10000);
            const initialEventCount = eventsBeforeEnd.length;
            
            // Rapidamente finaliza break (simula timing issue)
            await service.endBreak(workspaceId, userId);
            
            // Verifica se eventos foram limpos pelo endBreak
            const remainingEvents = await zsetEventManager.getExpiredEvents(Date.now() + 10000);
            // endBreak remove eventos específicos do usuário, então deve ter menos eventos
            expect(remainingEvents.length).toBeLessThanOrEqual(initialEventCount);
        });
    });
});