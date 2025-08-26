import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DistributorCronService } from '../services/distributor-cron.service';
import { ConversationAutomaticDistributionService } from '../services/conversation-automatic-distribution.service';
import { ConversationAutomaticDistributionLogService } from '../services/conversation-automatic-distribution-log.service';
import { DistributionRuleService } from '../services/distribution-rule.service';
import { ExternalDataService } from '../services/external-data.service';
import { DistributionType } from '../enums/distribution-type.enum';
import { ActivityType } from 'kissbot-core';
import { ExternalDataServiceMock } from './mocks/external-data-service-mock.service';
import { v4 } from 'uuid';

describe('MODULE: conversation-automatic-distribution', () => {
    let service: DistributorCronService;
    let conversationService: ConversationAutomaticDistributionService;
    let distributionRuleService: DistributionRuleService;
    let externalDataService: ExternalDataService;
    let logService: ConversationAutomaticDistributionLogService;

    const mockConversationService = {
        getConversationsByWorkspaceId: jest.fn(),
    };

    const mockDistributionRuleService = {
        getActiveDistributionRules: jest.fn(),
        getDistributionRuleByWorkspace: jest.fn(),
    };

    const mockLogService = {
        getLastAssignmentByTeamId: jest.fn(),
        getAssignmentsByAgentIdList: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DistributorCronService,
                {
                    provide: ConversationAutomaticDistributionService,
                    useValue: mockConversationService,
                },
                {
                    provide: ConversationAutomaticDistributionLogService,
                    useValue: mockLogService,
                },
                {
                    provide: DistributionRuleService,
                    useValue: mockDistributionRuleService,
                },
                {
                    provide: ExternalDataService,
                    useClass: ExternalDataServiceMock,
                },
            ],
        })
        .setLogger(false) // Disable logging during tests
        .compile();

        service = module.get<DistributorCronService>(DistributorCronService);
        conversationService = module.get<ConversationAutomaticDistributionService>(ConversationAutomaticDistributionService);
        distributionRuleService = module.get<DistributionRuleService>(DistributionRuleService);
        externalDataService = module.get<ExternalDataService>(ExternalDataService);
        logService = module.get<ConversationAutomaticDistributionLogService>(ConversationAutomaticDistributionLogService);
    });

    beforeAll(() => {
        // Mock the Logger to suppress console output during tests
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SERVICE: DistributorCronService', () => {
        const workspaceId = ExternalDataServiceMock.workspaceId.toString();
        const teamId = ExternalDataServiceMock.teamId.toString();
        const agentId1 = ExternalDataServiceMock.agentId1;
        const agentId2 = ExternalDataServiceMock.agentId2;

        describe('FUNCTION: getLastAssignedAgent', () => {
            it('should return the last assigned agent ID', async () => {
                const mockLog = {
                    assignedAgentId: agentId1,
                    createdAt: new Date(),
                };

                mockLogService.getLastAssignmentByTeamId.mockResolvedValue(mockLog);

                const result = await service['getLastAssignedAgent'](teamId);

                expect(result).toBe(agentId1);
                expect(mockLogService.getLastAssignmentByTeamId).toHaveBeenCalledWith(teamId);
            });

            it('should return null when no assignments exist', async () => {
                mockLogService.getLastAssignmentByTeamId.mockResolvedValue(null);

                const result = await service['getLastAssignedAgent'](teamId);

                expect(result).toBeNull();
            });

            it('should return null when service throws error', async () => {
                mockLogService.getLastAssignmentByTeamId.mockRejectedValue(new Error('Database error'));

                const result = await service['getLastAssignedAgent'](teamId);

                expect(result).toBeNull();
            });
        });

        describe('FUNCTION: filterAgentsByConversationLimit', () => {
            it('should filter agents by conversation limit', () => {
                const agents = [
                    { id: agentId1, currentConversations: 3 },
                    { id: agentId2, currentConversations: 8 },
                ] as any;

                const result = service['filterAgentsByConversationLimit'](agents, 5);

                expect(result).toHaveLength(1);
                expect(result[0].id).toBe(agentId1);
            });

            it('should return empty array when all agents exceed limit', () => {
                const agents = [
                    { id: agentId1, currentConversations: 10 },
                    { id: agentId2, currentConversations: 15 },
                ] as any;

                const result = service['filterAgentsByConversationLimit'](agents, 5);

                expect(result).toHaveLength(0);
            });

            it('should return all agents when none exceed limit', () => {
                const agents = [
                    { id: agentId1, currentConversations: 2 },
                    { id: agentId2, currentConversations: 3 },
                ] as any;

                const result = service['filterAgentsByConversationLimit'](agents, 5);

                expect(result).toHaveLength(2);
            });
        });

        describe('FUNCTION: selectAgentByLoadBalancer', () => {
            it('should return the only agent when only one available', () => {
                const agents = [
                    { id: agentId1, currentConversations: 3, lastAssignedAt: new Date() },
                ] as any;

                const result = service['selectAgentByLoadBalancer'](agents);

                expect(result).toBe(agents[0]);
            });

            it('should return agent with fewer conversations', () => {
                const agents = [
                    { id: agentId1, currentConversations: 5, lastAssignedAt: new Date() },
                    { id: agentId2, currentConversations: 2, lastAssignedAt: new Date() },
                ] as any;

                const result = service['selectAgentByLoadBalancer'](agents);

                expect(result.id).toBe(agentId2);
            });

            it('should avoid last assigned agent when possible', () => {
                const agents = [
                    { id: agentId1, currentConversations: 3, lastAssignedAt: new Date(Date.now() - 1000) },
                    { id: agentId2, currentConversations: 3, lastAssignedAt: new Date(Date.now() - 2000) },
                ] as any;

                const result = service['selectAgentByLoadBalancer'](agents, agentId1);

                expect(result.id).toBe(agentId2);
            });

            it('should return agent without assignment history first', () => {
                const agents = [
                    { id: agentId1, currentConversations: 3, lastAssignedAt: new Date() },
                    { id: agentId2, currentConversations: 3, lastAssignedAt: null },
                ] as any;

                const result = service['selectAgentByLoadBalancer'](agents);

                expect(result.id).toBe(agentId2);
            });

            it('should return null when no agents provided', () => {
                const result = service['selectAgentByLoadBalancer']([]);

                expect(result).toBeNull();
            });
        });

        describe('FUNCTION: getAvailableAgents', () => {
            it('should return available agents with workload information', async () => {
                const mockTeam = {
                    roleUsers: [
                        { userId: agentId1, permission: { canViewHistoricConversation: false } },
                        { userId: agentId2, permission: { canViewHistoricConversation: false } },
                        { userId: v4(), permission: { canViewHistoricConversation: true } },
                    ],
                    toJSON: function() { return this; },
                };

                const mockUsers = [
                    { _id: agentId1, name: 'Agent 1', email: 'agent1@test.com' },
                    { _id: agentId2, name: 'Agent 2', email: 'agent2@test.com' },
                ];

                const mockConversationCounts = new Map();
                mockConversationCounts.set(agentId1, 3);
                mockConversationCounts.set(agentId2, 1);

                const mockLastAssignments = new Map();
                mockLastAssignments.set(agentId1, new Date('2023-01-01'));
                mockLastAssignments.set(agentId2, undefined);

                jest.spyOn(externalDataService, 'getTeamById').mockResolvedValue(mockTeam);
                jest.spyOn(externalDataService, 'getUsersByQuery').mockResolvedValue(mockUsers);
                jest.spyOn(externalDataService, 'getUserConversationCounts').mockResolvedValue(mockConversationCounts);
                jest.spyOn(service as any, 'getBatchLastAssignmentDates').mockResolvedValue(mockLastAssignments);

                const result = await service['getAvailableAgents'](teamId, workspaceId);

                expect(result).toHaveLength(2);
                expect(result[0].id).toBe(agentId1);
                expect(result[0].currentConversations).toBe(3);
                expect(result[1].id).toBe(agentId2);
                expect(result[1].currentConversations).toBe(1);
            });

            it('should return empty array when team has no agents', async () => {
                const mockTeam = {
                    roleUsers: [
                        { userId: v4(), permission: { canViewHistoricConversation: true } },
                    ],
                    toJSON: function() { return this; },
                };

                jest.spyOn(externalDataService, 'getTeamById').mockResolvedValue(mockTeam);

                const result = await service['getAvailableAgents'](teamId, workspaceId);

                expect(result).toHaveLength(0);
            });

            it('should handle team not found', async () => {
                jest.spyOn(externalDataService, 'getTeamById').mockResolvedValue(null);

                const result = await service['getAvailableAgents'](teamId, workspaceId);

                expect(result).toHaveLength(0);
            });

            it('should handle error gracefully', async () => {
                jest.spyOn(externalDataService, 'getTeamById').mockRejectedValue(new Error('Team service error'));

                const result = await service['getAvailableAgents'](teamId, workspaceId);

                expect(result).toHaveLength(0);
            });
        });

        describe('FUNCTION: getNextAgent', () => {
            it('should return agent when all conditions are met', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                const mockRule = {
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const mockAgents = [
                    { id: agentId1, name: 'Agent 1', email: 'agent1@test.com', currentConversations: 2 },
                ];

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockResolvedValue(mockRule);
                jest.spyOn(service as any, 'getAvailableAgents').mockResolvedValue(mockAgents);
                jest.spyOn(service as any, 'filterAgentsByConversationLimit').mockReturnValue(mockAgents);
                jest.spyOn(service as any, 'selectAgentByLoadBalancer').mockReturnValue(mockAgents[0]);

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeDefined();
                expect(result.agent.id).toBe(agentId1);
                expect(result.executedRules).toContain(DistributionType.CONVERSATION_LIMIT);
                expect(result.executedRules).toContain(DistributionType.LOAD_BALANCER);
            });

            it('should return null when no distribution rule exists', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockResolvedValue(null);

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeNull();
                expect(result.executedRules).toHaveLength(0);
            });

            it('should return null when distribution rule is not active', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                const mockRule = {
                    active: false,
                    maxConversationsPerAgent: 5,
                };

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockResolvedValue(mockRule);

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeNull();
                expect(result.executedRules).toHaveLength(0);
            });

            it('should return null when no available agents', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                const mockRule = {
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockResolvedValue(mockRule);
                jest.spyOn(service as any, 'getAvailableAgents').mockResolvedValue([]);

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeNull();
                expect(result.executedRules).toHaveLength(0);
            });

            it('should return null when no agents within conversation limit', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                const mockRule = {
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const mockAgents = [
                    { id: agentId1, currentConversations: 10 },
                ];

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockResolvedValue(mockRule);
                jest.spyOn(service as any, 'getAvailableAgents').mockResolvedValue(mockAgents);
                jest.spyOn(service as any, 'filterAgentsByConversationLimit').mockReturnValue([]);

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeNull();
                expect(result.executedRules).toHaveLength(0);
            });

            it('should handle errors gracefully', async () => {
                const context = {
                    workspaceId,
                    teamId,
                    conversationId: v4(),
                    lastAssignedAgentId: null,
                };

                mockDistributionRuleService.getDistributionRuleByWorkspace.mockRejectedValue(new Error('Database error'));

                const result = await service['getNextAgent'](context);

                expect(result.agent).toBeNull();
                expect(result.executedRules).toHaveLength(0);
            });
        });

        describe('FUNCTION: logAssignment', () => {
            it('should save assignment log successfully', async () => {
                const conversation = {
                    conversationId: v4(),
                    workspaceId,
                    teamId,
                    priority: 1,
                    order: 2,
                    state: 'open',
                } as any;

                const assignmentResult = {
                    agent: {
                        id: agentId1,
                        name: 'Agent 1',
                        email: 'agent1@test.com',
                        teamId,
                    },
                    executedRules: [DistributionType.LOAD_BALANCER],
                };

                mockLogService.save.mockResolvedValue({});

                await service['logAssignment'](conversation, assignmentResult);

                expect(mockLogService.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        conversationId: conversation.conversationId,
                        workspaceId: conversation.workspaceId,
                        teamId: conversation.teamId,
                        assignedAgentId: assignmentResult.agent.id,
                        assignedAgentName: assignmentResult.agent.name,
                        executedRules: assignmentResult.executedRules,
                        priority: conversation.priority,
                        order: conversation.order,
                    })
                );
            });
        });

        describe('FUNCTION: transferConversationToAgent', () => {
            it('should transfer conversation successfully', async () => {
                const conversation = {
                    conversationId: v4(),
                } as any;

                const agent = {
                    id: agentId1,
                    name: 'Agent 1',
                    email: 'agent1@test.com',
                    teamId,
                };

                jest.spyOn(externalDataService, 'transferConversationToAgent').mockResolvedValue(undefined);

                await service['transferConversationToAgent'](conversation, agent);

                expect(externalDataService.transferConversationToAgent).toHaveBeenCalledWith(
                    conversation.conversationId,
                    agent.id
                );
            });

            it('should throw error when transfer fails', async () => {
                const conversation = {
                    conversationId: v4(),
                } as any;

                const agent = {
                    id: agentId1,
                    name: 'Agent 1',
                    email: 'agent1@test.com',
                    teamId,
                };

                jest.spyOn(externalDataService, 'transferConversationToAgent').mockRejectedValue(new Error('Transfer failed'));

                await expect(
                    service['transferConversationToAgent'](conversation, agent)
                ).rejects.toThrow('Transfer failed');
            });
        });

        describe('FUNCTION: createAutomaticDistributionActivity', () => {
            it('should create activity with existing system member', async () => {
                const conversation = {
                    conversationId: v4(),
                } as any;

                const assignmentResult = {
                    agent: {
                        id: agentId1,
                        name: 'Agent 1',
                        email: 'agent1@test.com',
                        teamId,
                    },
                    executedRules: [],
                };

                const mockConversation = {
                    _id: conversation.conversationId,
                    members: [
                        { type: 'system', id: 'system-id', name: 'system' },
                    ],
                };

                jest.spyOn(externalDataService, 'getConversationById').mockResolvedValue(mockConversation);
                jest.spyOn(externalDataService, 'dispatchMessageActivity').mockResolvedValue(undefined);

                await service['createAutomaticDistributionActivity'](conversation, assignmentResult);

                expect(externalDataService.dispatchMessageActivity).toHaveBeenCalledWith(
                    mockConversation,
                    expect.objectContaining({
                        type: ActivityType.automatic_distribution,
                        conversationId: conversation.conversationId,
                        from: {
                            type: 'system',
                            id: 'system-id',
                            name: 'system',
                        },
                        data: {
                            memberId: assignmentResult.agent.id,
                            memberName: assignmentResult.agent.name,
                        },
                    })
                );
            });

            it('should create system member when not exists', async () => {
                const conversation = {
                    conversationId: v4(),
                } as any;

                const assignmentResult = {
                    agent: {
                        id: agentId1,
                        name: 'Agent 1',
                        email: 'agent1@test.com',
                        teamId,
                    },
                    executedRules: [],
                };

                const mockConversation = {
                    _id: conversation.conversationId,
                    members: [],
                };

                jest.spyOn(externalDataService, 'getConversationById').mockResolvedValue(mockConversation);
                jest.spyOn(externalDataService, 'addMember').mockResolvedValue(undefined);
                jest.spyOn(externalDataService, 'dispatchMessageActivity').mockResolvedValue(undefined);

                await service['createAutomaticDistributionActivity'](conversation, assignmentResult);

                expect(externalDataService.addMember).toHaveBeenCalledWith(
                    mockConversation._id,
                    expect.objectContaining({
                        type: 'system',
                        name: 'system',
                    })
                );
            });

            it('should handle errors gracefully', async () => {
                const conversation = {
                    conversationId: v4(),
                } as any;

                const assignmentResult = {
                    agent: {
                        id: agentId1,
                        name: 'Agent 1',
                        email: 'agent1@test.com',
                        teamId,
                    },
                    executedRules: [],
                };

                jest.spyOn(externalDataService, 'getConversationById').mockRejectedValue(new Error('Conversation not found'));

                await expect(
                    service['createAutomaticDistributionActivity'](conversation, assignmentResult)
                ).resolves.toBeUndefined();
            });
        });
    });
});