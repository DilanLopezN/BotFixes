import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationAutomaticDistributionLogService } from '../services/conversation-automatic-distribution-log.service';
import { ConversationAutomaticDistributionLog } from '../models/conversation-automatic-distribution-log.entity';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';
import { v4 } from 'uuid';

describe('MODULE: conversation-automatic-distribution', () => {
    let service: ConversationAutomaticDistributionLogService;
    let repository: Repository<ConversationAutomaticDistributionLog>;

    const mockRepository = {
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationAutomaticDistributionLogService,
                {
                    provide: getRepositoryToken(ConversationAutomaticDistributionLog, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION),
                    useValue: mockRepository,
                },
            ],
        })
        .setLogger(false) // Disable logging during tests
        .compile();

        service = module.get<ConversationAutomaticDistributionLogService>(ConversationAutomaticDistributionLogService);
        repository = module.get(getRepositoryToken(ConversationAutomaticDistributionLog, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SERVICE: ConversationAutomaticDistributionLogService', () => {
        const teamId = v4();
        const agentId1 = v4();
        const agentId2 = v4();
        const agentId3 = v4();

        describe('FUNCTION: save', () => {
            it('should save a new distribution log entry', async () => {
                const logData = new ConversationAutomaticDistributionLog();
                logData.conversationId = v4();
                logData.workspaceId = v4();
                logData.teamId = teamId;
                logData.assignedAgentId = agentId1;
                logData.assignedAgentName = 'Agent 1';
                logData.executedRules = ['LOAD_BALANCER'];
                logData.priority = 1;
                logData.order = 1;
                logData.assignmentData = {
                    agentDetails: { id: agentId1, name: 'Agent 1' },
                    conversationState: 'open',
                    timestamp: new Date(),
                };

                const savedLog = { ...logData, id: 1 };
                mockRepository.save.mockResolvedValue(savedLog);

                const result = await service.save(logData);

                expect(mockRepository.save).toHaveBeenCalledWith(logData);
                expect(result).toBeDefined();
                expect(result.id).toBe(1);
                expect(result.assignedAgentId).toBe(agentId1);
                expect(result.assignedAgentName).toBe('Agent 1');
            });

            it('should save log entry with optional fields', async () => {
                const logData = new ConversationAutomaticDistributionLog();
                logData.conversationId = v4();
                logData.workspaceId = v4();
                logData.teamId = teamId;
                logData.assignedAgentId = agentId1;
                logData.assignedAgentName = 'Agent 1';
                logData.priority = 1;
                logData.order = 1;
                logData.executedRules = [];

                const savedLog = { ...logData, id: 2 };
                mockRepository.save.mockResolvedValue(savedLog);

                const result = await service.save(logData);

                expect(mockRepository.save).toHaveBeenCalledWith(logData);
                expect(result).toBeDefined();
                expect(result.id).toBe(2);
                expect(result.executedRules).toEqual([]);
            });
        });

        describe('FUNCTION: getLastAssignmentByTeamId', () => {
            it('should return the most recent assignment for a team', async () => {
                const mockLog = {
                    id: 1,
                    assignedAgentId: agentId2,
                    assignedAgentName: 'Agent 2',
                    createdAt: new Date(),
                };

                const mockQueryBuilder = {
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    getOne: jest.fn().mockResolvedValue(mockLog),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getLastAssignmentByTeamId(teamId);

                expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('log');
                expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.teamId = :teamId', { teamId });
                expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('log.createdAt', 'DESC');
                expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
                expect(result).toBeDefined();
                expect(result.assignedAgentId).toBe(agentId2);
            });

            it('should return null when no assignments exist for team', async () => {
                const mockQueryBuilder = {
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    getOne: jest.fn().mockResolvedValue(null),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getLastAssignmentByTeamId(v4());

                expect(result).toBeNull();
            });
        });

        describe('FUNCTION: getAssignmentsByAgentIdList', () => {
            it('should return last assignment dates for multiple agents', async () => {
                const mockResults = [
                    { log_assignedAgentId: agentId1, lastAssignedAt: '2023-01-02T10:00:00Z' },
                    { log_assignedAgentId: agentId2, lastAssignedAt: '2023-01-03T10:00:00Z' },
                ];

                const mockQueryBuilder = {
                    select: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    getRawMany: jest.fn().mockResolvedValue(mockResults),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getAssignmentsByAgentIdList([agentId1, agentId2, agentId3]);

                expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('log');
                expect(mockQueryBuilder.select).toHaveBeenCalledWith(['log.assignedAgentId', 'MAX(log.createdAt) as lastAssignedAt']);
                expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.assignedAgentId IN (:...agentIds)', { agentIds: [agentId1, agentId2, agentId3] });
                expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('log.assignedAgentId');
                expect(result).toHaveLength(2);
                expect(result[0].log_assignedAgentId).toBe(agentId1);
                expect(result[1].log_assignedAgentId).toBe(agentId2);
            });

            it('should return empty array when no assignments exist for provided agents', async () => {
                const mockQueryBuilder = {
                    select: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    getRawMany: jest.fn().mockResolvedValue([]),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getAssignmentsByAgentIdList([agentId1, agentId2]);

                expect(result).toHaveLength(0);
            });

            it('should handle empty agent list', async () => {
                const mockQueryBuilder = {
                    select: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    getRawMany: jest.fn().mockResolvedValue([]),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getAssignmentsByAgentIdList([]);

                expect(result).toHaveLength(0);
            });

            it('should return only agents that have assignments', async () => {
                const mockResults = [
                    { log_assignedAgentId: agentId1, lastAssignedAt: '2023-01-01T10:00:00Z' },
                ];

                const mockQueryBuilder = {
                    select: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    getRawMany: jest.fn().mockResolvedValue(mockResults),
                };

                mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                const result = await service.getAssignmentsByAgentIdList([agentId1, agentId2, agentId3]);

                expect(result).toHaveLength(1);
                expect(result[0].log_assignedAgentId).toBe(agentId1);
            });
        });
    });
});