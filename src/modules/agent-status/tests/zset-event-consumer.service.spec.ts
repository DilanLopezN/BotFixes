import { Test, TestingModule } from '@nestjs/testing';
import { ZSetEventConsumerService } from '../services/zset-event-consumer.service';
import { ZSetEventManagerService, EventType } from '../services/zset-event-manager.service';
import { EventsService } from '../../events/events.service';
import { v4 } from 'uuid';
import * as bootstrapOptions from '../../../common/utils/bootstrapOptions';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('ZSetEventConsumerService', () => {
    let service: ZSetEventConsumerService;
    let zsetEventManager: ZSetEventManagerService;
    let eventsService: EventsService;
    let moduleRef: TestingModule;

    const mockZSetEventManager = {
        getExpiredEvents: jest.fn(),
    };

    const mockEventsService = {
        sendEvent: jest.fn(),
    };

    beforeAll(async () => {
        // Mock shouldRunCron para retornar true nos testes
        jest.spyOn(bootstrapOptions, 'shouldRunCron').mockReturnValue(true);

        moduleRef = await Test.createTestingModule({
            providers: [
                ZSetEventConsumerService,
                {
                    provide: ZSetEventManagerService,
                    useValue: mockZSetEventManager,
                },
                {
                    provide: EventsService,
                    useValue: mockEventsService,
                },
            ],
        }).compile();

        service = moduleRef.get<ZSetEventConsumerService>(ZSetEventConsumerService);
        zsetEventManager = moduleRef.get<ZSetEventManagerService>(ZSetEventManagerService);
        eventsService = moduleRef.get<EventsService>(EventsService);
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await moduleRef.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset para comportamento padrão, mas mantém shouldRunCron = true
        jest.spyOn(bootstrapOptions, 'shouldRunCron').mockReturnValue(true);
        mockZSetEventManager.getExpiredEvents.mockResolvedValue([]);
        mockEventsService.sendEvent.mockResolvedValue(true);
    });

    describe('processExpiredEvents', () => {
        it('não deve executar quando shouldRunCron retorna false', async () => {
            jest.spyOn(bootstrapOptions, 'shouldRunCron').mockReturnValue(false);

            await service.processExpiredEvents();

            expect(zsetEventManager.getExpiredEvents).not.toHaveBeenCalled();
            expect(eventsService.sendEvent).not.toHaveBeenCalled();
        });

        it('deve processar eventos LAST_ACCESS expirados corretamente', async () => {
            const workspaceId = v4();
            const userId = v4();
            const pastTimestamp = Date.now() - 10000;

            const mockEvents = [{
                type: EventType.LAST_ACCESS,
                workspaceId,
                userId,
                timestamp: pastTimestamp,
            }];

            mockZSetEventManager.getExpiredEvents.mockResolvedValue(mockEvents);

            await service.processExpiredEvents();

            expect(eventsService.sendEvent).toHaveBeenCalledWith({
                data: { workspaceId, userId },
                dataType: 'agent.status',
                source: 'kissbot-api',
                type: 'agent.status.inactive.start',
            });

            // Chaves são removidas pelo working-time.service automaticamente
        });

        it('deve processar eventos BREAK_EXPIRATION expirados corretamente', async () => {
            const workspaceId = v4();
            const userId = v4();
            const pastTimestamp = Date.now() - 10000;

            const mockEvents = [{
                type: EventType.BREAK_EXPIRATION,
                workspaceId,
                userId,
                timestamp: pastTimestamp,
            }];

            mockZSetEventManager.getExpiredEvents.mockResolvedValue(mockEvents);

            await service.processExpiredEvents();

            expect(eventsService.sendEvent).toHaveBeenCalledWith({
                data: { workspaceId, userId },
                dataType: 'agent.status',
                source: 'kissbot-api',
                type: 'agent.status.inactive.end',
            });

            // Chaves são removidas pelo working-time.service automaticamente
        });

        it('não deve processar quando não há eventos expirados', async () => {
            mockZSetEventManager.getExpiredEvents.mockResolvedValue([]);

            await service.processExpiredEvents();

            expect(eventsService.sendEvent).not.toHaveBeenCalled();
        });

        it('deve tratar múltiplos eventos expirados', async () => {
            const workspaceId = v4();
            const userId1 = v4();
            const userId2 = v4();

            const mockEvents = [
                { type: EventType.LAST_ACCESS, workspaceId, userId: userId1, timestamp: Date.now() - 5000 },
                { type: EventType.BREAK_EXPIRATION, workspaceId, userId: userId2, timestamp: Date.now() - 5000 }
            ];

            mockZSetEventManager.getExpiredEvents.mockResolvedValue(mockEvents);

            await service.processExpiredEvents();

            expect(eventsService.sendEvent).toHaveBeenCalledTimes(2);
            // Chaves são removidas pelo working-time.service automaticamente
        });
    });

    describe('processEventManually', () => {
        it('deve processar evento LAST_ACCESS manualmente', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.processEventManually(EventType.LAST_ACCESS, workspaceId, userId);

            expect(eventsService.sendEvent).toHaveBeenCalledWith({
                data: { workspaceId, userId },
                dataType: 'agent.status',
                source: 'kissbot-api',
                type: 'agent.status.inactive.start',
            });
        });

        it('deve processar evento BREAK_EXPIRATION manualmente', async () => {
            const workspaceId = v4();
            const userId = v4();

            await service.processEventManually(EventType.BREAK_EXPIRATION, workspaceId, userId);

            expect(eventsService.sendEvent).toHaveBeenCalledWith({
                data: { workspaceId, userId },
                dataType: 'agent.status',
                source: 'kissbot-api',
                type: 'agent.status.inactive.end',
            });
        });
    });

    describe('Cenários críticos do bug em produção', () => {
        it('documenta o cenário exato do bug acontecendo em produção', async () => {
            // Cenário real em produção:
            // 1. Redis connection instável
            // 2. getExpiredEvents retorna [] por client null  
            // 3. Log "No expired events to process"
            // 4. Eventos não são processados (return early)
            // 5. Chaves ficam no Redis para nova tentativa
            // 6. working-time.service remove as chaves quando necessário
            // 7. Sistema funciona corretamente com retry automático

            mockZSetEventManager.getExpiredEvents.mockResolvedValue([]); // Client null scenario

            await service.processExpiredEvents();

            // Comportamento problemático confirmado:
            expect(eventsService.sendEvent).not.toHaveBeenCalled(); // Eventos não processados
            
            // Resultado: chaves permanecem no Redis para nova tentativa (comportamento correto agora)
        });

        it('deve mostrar comportamento correto quando Redis funciona adequadamente', async () => {
            const workspaceId = v4();
            const userId = v4();
            const mockEvents = [{
                type: EventType.LAST_ACCESS,
                workspaceId,
                userId,
                timestamp: Date.now() - 5000,
            }];

            mockZSetEventManager.getExpiredEvents.mockResolvedValue(mockEvents);

            await service.processExpiredEvents();

            // Comportamento correto: eventos enviados para fila, remoção acontece no working-time.service
            expect(eventsService.sendEvent).toHaveBeenCalledTimes(1);
        });

        it('deve prevenir execução concorrente com lock isProcessing', async () => {
            const mockEvents = [{
                type: EventType.LAST_ACCESS,
                workspaceId: v4(),
                userId: v4(),
                timestamp: Date.now() - 5000,
            }];

            // Simula processamento lento
            mockZSetEventManager.getExpiredEvents.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return mockEvents;
            });

            // Executa em paralelo
            const promise1 = service.processExpiredEvents();
            const promise2 = service.processExpiredEvents();

            await Promise.all([promise1, promise2]);

            // Apenas uma execução deve processar devido ao lock
            expect(eventsService.sendEvent).toHaveBeenCalledTimes(1);
        });
    });
});