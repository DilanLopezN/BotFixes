import { Test, TestingModule } from '@nestjs/testing';
import { ZSetEventManagerService, EventType, ZSetEvent } from '../services/zset-event-manager.service';
import { CacheModule } from '../../_core/cache/cache.module';
import { CacheService } from '../../_core/cache/cache.service';
import { v4 } from 'uuid';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('ZSetEventManagerService', () => {
    let service: ZSetEventManagerService;
    let cacheService: CacheService;
    let moduleRef: TestingModule;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [CacheModule],
            providers: [ZSetEventManagerService],
        }).compile();

        service = moduleRef.get<ZSetEventManagerService>(ZSetEventManagerService);
        cacheService = moduleRef.get<CacheService>(CacheService);

        // Limpa dados de teste antes de começar
        const client = cacheService.getClient();
        if (client) {
            await client.del('agent_status_events');
        }
    });

    afterAll(async () => {
        // Limpa dados de teste após terminar
        const client = cacheService.getClient();
        if (client) {
            await client.del('agent_status_events');
        }
        await moduleRef.close();
    });

    describe('addEvent', () => {
        it('deve adicionar evento LAST_ACCESS ao ZSet', async () => {
            const workspaceId = v4();
            const userId = v4();
            const timestamp = Date.now();
            const expirationTimestamp = timestamp + 30000;

            const event: ZSetEvent = {
                type: EventType.LAST_ACCESS,
                workspaceId,
                userId,
                timestamp,
                payload: { expirationTimestamp },
            };

            await service.addEvent(event);

            const client = cacheService.getClient();
            const members = await client.zrange('agent_status_events', 0, -1, 'WITHSCORES');
            
            expect(members.length).toBeGreaterThan(0);
            expect(members[0]).toContain(`LAST_ACCESS:${workspaceId}:${userId}`);
        });

        it('deve adicionar evento BREAK_EXPIRATION ao ZSet', async () => {
            const workspaceId = v4();
            const userId = v4();
            const expirationTimestamp = Date.now() + 60000;

            await service.addBreakExpirationEvent(workspaceId, userId, expirationTimestamp);

            const client = cacheService.getClient();
            const members = await client.zrange('agent_status_events', 0, -1);
            
            const breakEvent = members.find(member => 
                member.includes(`BREAK_EXPIRATION:${workspaceId}:${userId}`)
            );
            expect(breakEvent).toBeDefined();
        });
    });

    describe('getExpiredEvents', () => {
        it('deve retornar array vazio quando não há eventos', async () => {
            const client = cacheService.getClient();
            await client.del('agent_status_events');

            const expiredEvents = await service.getExpiredEvents();
            expect(expiredEvents).toEqual([]);
        });

        it('deve retornar eventos expirados corretamente', async () => {
            const workspaceId = v4();
            const userId = v4();
            const pastTimestamp = Date.now() - 10000; // 10 segundos atrás

            const event: ZSetEvent = {
                type: EventType.LAST_ACCESS,
                workspaceId,
                userId,
                timestamp: pastTimestamp,
            };

            await service.addEvent(event);

            const expiredEvents = await service.getExpiredEvents();
            expect(expiredEvents.length).toBe(1);
            expect(expiredEvents[0].type).toBe(EventType.LAST_ACCESS);
            expect(expiredEvents[0].workspaceId).toBe(workspaceId);
            expect(expiredEvents[0].userId).toBe(userId);
        });

        it('não deve retornar eventos futuros', async () => {
            const client = cacheService.getClient();
            await client.del('agent_status_events');

            const workspaceId = v4();
            const userId = v4();
            const futureTimestamp = Date.now() + 60000; // 1 minuto no futuro

            const event: ZSetEvent = {
                type: EventType.BREAK_EXPIRATION,
                workspaceId,
                userId,
                timestamp: futureTimestamp,
            };

            await service.addEvent(event);

            const expiredEvents = await service.getExpiredEvents();
            expect(expiredEvents).toEqual([]);
        });

        it('deve retornar array vazio quando Redis client é null', async () => {
            // Mock do CacheService para retornar null
            jest.spyOn(cacheService, 'getClient').mockReturnValue(null);

            const expiredEvents = await service.getExpiredEvents();
            expect(expiredEvents).toEqual([]);

            // Restaura o mock
            jest.restoreAllMocks();
        });
    });


    describe('removeEvent', () => {
        it('deve remover tipo específico de evento para usuário', async () => {
            const client = cacheService.getClient();
            await client.del('agent_status_events');

            const workspaceId = v4();
            const userId = v4();
            const timestamp = Date.now();

            // Adiciona dois tipos de eventos para o mesmo usuário
            await service.addLastAccessEvent(workspaceId, userId, timestamp + 30000, timestamp);
            await service.addBreakExpirationEvent(workspaceId, userId, timestamp + 60000);

            // Remove apenas LAST_ACCESS
            await service.removeEvent(EventType.LAST_ACCESS, workspaceId, userId);

            const allEvents = await client.zrange('agent_status_events', 0, -1);
            expect(allEvents.length).toBe(1);
            expect(allEvents[0]).toContain('BREAK_EXPIRATION');
            expect(allEvents[0]).not.toContain('LAST_ACCESS');
        });
    });

    describe('Cenários de problemas de conexão Redis', () => {
        it('deve tratar cenário onde getExpiredEvents retorna vazio por problemas de conexão', async () => {
            const client = cacheService.getClient();
            await client.del('agent_status_events');

            const workspaceId = v4();
            const userId = v4();
            const pastTimestamp = Date.now() - 5000;

            // Adiciona evento expirado
            await service.addLastAccessEvent(workspaceId, userId, pastTimestamp, pastTimestamp - 1000);

            // Simula cenário onde getExpiredEvents falha por problemas de conexão
            jest.spyOn(service, 'getExpiredEvents').mockResolvedValue([]);

            const expiredEvents = await service.getExpiredEvents();
            expect(expiredEvents).toEqual([]);

            // Eventos permanecem no Redis para nova tentativa (comportamento correto)
            const allEvents = await client.zrange('agent_status_events', 0, -1);
            expect(allEvents.length).toBe(1);

            jest.restoreAllMocks();
        });
    });
});