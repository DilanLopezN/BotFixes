import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationAutomaticDistributionService } from '../services/conversation-automatic-distribution.service';
import { ConversationAutomaticDistribution } from '../models/conversation-automatic-distribution.entity';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';
import { KissbotEventType } from 'kissbot-core';
import { v4 } from 'uuid';

describe('MODULE: conversation-automatic-distribution', () => {
    let service: ConversationAutomaticDistributionService;
    let repository: Repository<ConversationAutomaticDistribution>;

    const mockRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationAutomaticDistributionService,
                {
                    provide: getRepositoryToken(ConversationAutomaticDistribution, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION),
                    useValue: mockRepository,
                },
            ],
        })
        .setLogger(false) // Disable logging during tests
        .compile();

        service = module.get<ConversationAutomaticDistributionService>(ConversationAutomaticDistributionService);
        repository = module.get(getRepositoryToken(ConversationAutomaticDistribution, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SERVICE: ConversationAutomaticDistributionService', () => {
        describe('FUNCTION: processEvent', () => {
            const workspaceId = v4();
            const conversationId = v4();
            const teamId = v4();

            it('should handle CONVERSATION_CLOSED event and remove distribution record', async () => {
                const existingDistribution = {
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 1,
                    hasMember: false,
                    createdAt: new Date(),
                };

                mockRepository.findOne.mockResolvedValue(existingDistribution);
                mockRepository.remove.mockResolvedValue(existingDistribution);

                const event = {
                    type: KissbotEventType.CONVERSATION_CLOSED,
                    data: {
                        conversationId,
                        workspaceId,
                    },
                };

                await service['processEvent'](event as any);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        workspaceId: event.data.workspaceId,
                        conversationId: event.data.conversationId,
                    },
                });
                expect(mockRepository.remove).toHaveBeenCalledWith(existingDistribution);
            });

            it('should handle CONVERSATION_ASSIGNED event and create new distribution record', async () => {
                mockRepository.findOne.mockResolvedValue(null);
                mockRepository.save.mockResolvedValue({
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 2,
                    priority: 3,
                    hasMember: true,
                    createdAt: new Date(),
                });

                const event = {
                    type: KissbotEventType.CONVERSATION_ASSIGNED,
                    data: {
                        conversationId,
                        workspace: { _id: workspaceId },
                        team: { _id: teamId },
                        conversation: {
                            state: 'open',
                            order: 2,
                            priority: 3,
                            members: [
                                { type: 'agent', disabled: false },
                            ],
                        },
                    },
                };

                await service['processEvent'](event as any);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        workspaceId: event.data.workspace._id,
                        conversationId: event.data.conversationId,
                    },
                });
                expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 2,
                    priority: 3,
                    hasMember: true,
                }));
            });

            it('should handle CONVERSATION_MEMBERS_UPDATED event and update hasMember status', async () => {
                const existingDistribution = {
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 1,
                    hasMember: false,
                    createdAt: new Date(),
                };

                mockRepository.findOne.mockResolvedValue(existingDistribution);
                mockRepository.update.mockResolvedValue({ affected: 1 });

                const event = {
                    type: KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
                    data: {
                        conversationId,
                        workspaceId,
                        members: [
                            { type: 'agent', disabled: false },
                            { type: 'customer', disabled: false },
                        ],
                    },
                };

                await service['processEvent'](event as any);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        workspaceId: event.data.workspaceId,
                        conversationId: event.data.conversationId,
                    },
                });
                expect(mockRepository.update).toHaveBeenCalledWith(existingDistribution.id, {
                    hasMember: true,
                });
            });

            it('should update teamId when team changes', async () => {
                const newTeamId = v4();
                const existingDistribution = {
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 1,
                    hasMember: false,
                    createdAt: new Date(),
                };

                mockRepository.findOne.mockResolvedValue(existingDistribution);
                mockRepository.update.mockResolvedValue({ affected: 1 });

                const event = {
                    type: KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
                    data: {
                        conversationId,
                        workspaceId,
                        team: { _id: newTeamId },
                        members: [],
                    },
                };

                await service['processEvent'](event as any);

                expect(mockRepository.update).toHaveBeenCalledWith(existingDistribution.id, {
                    teamId: newTeamId,
                    hasMember: false,
                });
            });

            it('should handle event with disabled agent members', async () => {
                const existingDistribution = {
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 1,
                    hasMember: true,
                    createdAt: new Date(),
                };

                mockRepository.findOne.mockResolvedValue(existingDistribution);
                mockRepository.update.mockResolvedValue({ affected: 1 });

                const event = {
                    type: KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
                    data: {
                        conversationId,
                        workspaceId,
                        members: [
                            { type: 'agent', disabled: true },
                            { type: 'customer', disabled: false },
                        ],
                    },
                };

                await service['processEvent'](event as any);

                expect(mockRepository.update).toHaveBeenCalledWith(existingDistribution.id, {
                    hasMember: false,
                });
            });
        });

        describe('FUNCTION: getConversationsByWorkspaceId', () => {
            const workspaceId = v4();

            it('should return only conversations without members for a workspace', async () => {
                const conversationsWithoutMembers = [
                    {
                        id: 2,
                        conversationId: v4(),
                        workspaceId,
                        teamId: v4(),
                        state: 'open',
                        order: 1,
                        priority: 3,
                        hasMember: false,
                        createdAt: new Date(Date.now() - 2000),
                    },
                    {
                        id: 3,
                        conversationId: v4(),
                        workspaceId,
                        teamId: v4(),
                        state: 'open',
                        order: 2,
                        priority: 2,
                        hasMember: false,
                        createdAt: new Date(Date.now() - 1000),
                    },
                ];

                mockRepository.find.mockResolvedValue(conversationsWithoutMembers);

                const result = await service.getConversationsByWorkspaceId(workspaceId);

                expect(mockRepository.find).toHaveBeenCalledWith({
                    where: {
                        workspaceId: workspaceId,
                        hasMember: false,
                    },
                    order: {
                        createdAt: 'ASC',
                        order: 'ASC',
                    },
                });
                expect(result).toHaveLength(2);
                expect(result.some(r => r.hasMember)).toBe(false);
            });

            it('should return empty array when no conversations without members exist', async () => {
                mockRepository.find.mockResolvedValue([]);

                const result = await service.getConversationsByWorkspaceId(workspaceId);

                expect(result).toHaveLength(0);
            });
        });

        describe('FUNCTION: handleConversationAssigned', () => {
            const workspaceId = v4();
            const conversationId = v4();
            const teamId = v4();

            it('should create new distribution when not exists', async () => {
                mockRepository.findOne.mockResolvedValue(null);
                mockRepository.save.mockResolvedValue({
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 2,
                    hasMember: false,
                    createdAt: new Date(),
                });

                const event = {
                    conversationId,
                    workspace: { _id: workspaceId },
                    team: { _id: teamId },
                    conversation: {
                        state: 'open',
                        order: 1,
                        priority: 2,
                        members: [],
                    },
                };

                await service['handleConversationAssigned'](event);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        workspaceId: event.workspace._id,
                        conversationId: event.conversationId,
                    },
                });
                expect(mockRepository.save).toHaveBeenCalled();
            });

            it('should update existing distribution when exists', async () => {
                const existingDistribution = {
                    id: 1,
                    conversationId,
                    workspaceId,
                    teamId,
                    state: 'open',
                    order: 1,
                    priority: 1,
                    hasMember: false,
                    createdAt: new Date(),
                };

                const newTeamId = v4();
                mockRepository.findOne.mockResolvedValue(existingDistribution);
                mockRepository.update.mockResolvedValue({ affected: 1 });

                const event = {
                    conversationId,
                    workspaceId,
                    team: { _id: newTeamId },
                    members: [
                        { type: 'agent', disabled: false },
                    ],
                };

                await service['handleConversationAssigned'](event);

                expect(mockRepository.update).toHaveBeenCalledWith(existingDistribution.id, {
                    teamId: newTeamId,
                    hasMember: true,
                });
            });
        });
    });
});