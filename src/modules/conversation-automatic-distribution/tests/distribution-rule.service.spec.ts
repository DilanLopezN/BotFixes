import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DistributionRuleService } from '../services/distribution-rule.service';
import { DistributionRule } from '../models/distribution-rule.entity';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';
import { CreateDistributionRuleDto, UpdateDistributionRuleDto } from '../dto/distribution-rule.dto';
import { v4 } from 'uuid';

describe('MODULE: conversation-automatic-distribution', () => {
    let service: DistributionRuleService;
    let repository: Repository<DistributionRule>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        findAndCount: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DistributionRuleService,
                {
                    provide: getRepositoryToken(DistributionRule, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION),
                    useValue: mockRepository,
                },
            ],
        })
        .setLogger(false) // Disable logging during tests
        .compile();

        service = module.get<DistributionRuleService>(DistributionRuleService);
        repository = module.get(getRepositoryToken(DistributionRule, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SERVICE: DistributionRuleService', () => {
        const workspaceId = v4();
        const workspaceId2 = v4();

        describe('FUNCTION: createDistributionRule', () => {
            it('should create a new distribution rule successfully', async () => {
                const createDto: CreateDistributionRuleDto = {
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const newRule = {
                    id: v4(),
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                mockRepository.create.mockReturnValue(newRule);
                mockRepository.save.mockResolvedValue(newRule);

                const result = await service.createDistributionRule(workspaceId, createDto);

                expect(mockRepository.create).toHaveBeenCalledWith({
                    workspaceId,
                    active: createDto.active,
                    maxConversationsPerAgent: createDto.maxConversationsPerAgent,
                });
                expect(mockRepository.save).toHaveBeenCalledWith(newRule);
                expect(result).toEqual(newRule);
            });

            it('should create an inactive distribution rule', async () => {
                const createDto: CreateDistributionRuleDto = {
                    active: false,
                    maxConversationsPerAgent: 10,
                };

                const newRule = {
                    id: v4(),
                    workspaceId,
                    active: false,
                    maxConversationsPerAgent: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                mockRepository.create.mockReturnValue(newRule);
                mockRepository.save.mockResolvedValue(newRule);

                const result = await service.createDistributionRule(workspaceId, createDto);

                expect(result.active).toBe(false);
                expect(result.maxConversationsPerAgent).toBe(10);
            });

            it('should throw BadRequestException when creating duplicate rule for same workspace', async () => {
                const createDto: CreateDistributionRuleDto = {
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const newRule = { workspaceId, ...createDto };
                mockRepository.create.mockReturnValue(newRule);

                const duplicateError = new Error('duplicate key');
                (duplicateError as any).code = '23505';
                mockRepository.save.mockRejectedValue(duplicateError);

                await expect(
                    service.createDistributionRule(workspaceId, createDto)
                ).rejects.toThrow(BadRequestException);
            });
        });

        describe('FUNCTION: getDistributionRuleByWorkspaceAndId', () => {
            it('should return distribution rule by workspace and id', async () => {
                const ruleId = v4();
                const mockRule = {
                    id: ruleId,
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                mockRepository.findOne.mockResolvedValue(mockRule);

                const result = await service.getDistributionRuleByWorkspaceAndId(workspaceId, ruleId);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: { workspaceId, id: ruleId },
                });
                expect(result).toEqual(mockRule);
            });

            it('should return null when rule does not exist', async () => {
                const nonExistentId = v4();

                mockRepository.findOne.mockResolvedValue(null);

                const result = await service.getDistributionRuleByWorkspaceAndId(workspaceId, nonExistentId);

                expect(result).toBeNull();
            });
        });

        describe('FUNCTION: getDistributionRuleByWorkspace', () => {
            it('should return distribution rule by workspace', async () => {
                const mockRule = {
                    id: v4(),
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                mockRepository.findOne.mockResolvedValue(mockRule);

                const result = await service.getDistributionRuleByWorkspace(workspaceId);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: { workspaceId },
                });
                expect(result).toEqual(mockRule);
            });

            it('should return null when no rule exists for workspace', async () => {
                mockRepository.findOne.mockResolvedValue(null);

                const result = await service.getDistributionRuleByWorkspace(workspaceId);

                expect(result).toBeNull();
            });
        });

        describe('FUNCTION: updateDistributionRule', () => {
            it('should update distribution rule successfully', async () => {
                const ruleId = v4();
                const existingRule = {
                    id: ruleId,
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const updateDto: UpdateDistributionRuleDto = {
                    active: false,
                    maxConversationsPerAgent: 10,
                };

                const updatedRule = {
                    ...existingRule,
                    ...updateDto,
                    updatedAt: new Date(),
                };

                mockRepository.findOne.mockResolvedValue(existingRule);
                mockRepository.save.mockResolvedValue(updatedRule);

                const result = await service.updateDistributionRule(workspaceId, ruleId, updateDto);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: { workspaceId, id: ruleId },
                });
                expect(mockRepository.save).toHaveBeenCalled();
                expect(result.active).toBe(false);
                expect(result.maxConversationsPerAgent).toBe(10);
            });

            it('should update only provided fields', async () => {
                const ruleId = v4();
                const existingRule = {
                    id: ruleId,
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                const updateDto: UpdateDistributionRuleDto = {
                    maxConversationsPerAgent: 15,
                };

                const updatedRule = {
                    ...existingRule,
                    maxConversationsPerAgent: 15,
                };

                mockRepository.findOne.mockResolvedValue(existingRule);
                mockRepository.save.mockResolvedValue(updatedRule);

                const result = await service.updateDistributionRule(workspaceId, ruleId, updateDto);

                expect(result.active).toBe(true);
                expect(result.maxConversationsPerAgent).toBe(15);
            });

            it('should throw NotFoundException when rule does not exist', async () => {
                const nonExistentId = v4();
                const updateDto: UpdateDistributionRuleDto = {
                    active: false,
                };

                mockRepository.findOne.mockResolvedValue(null);

                await expect(
                    service.updateDistributionRule(workspaceId, nonExistentId, updateDto)
                ).rejects.toThrow(NotFoundException);
            });
        });

        describe('FUNCTION: deleteDistributionRule', () => {
            it('should delete distribution rule successfully', async () => {
                const ruleId = v4();
                const existingRule = {
                    id: ruleId,
                    workspaceId,
                    active: true,
                    maxConversationsPerAgent: 5,
                };

                mockRepository.findOne.mockResolvedValue(existingRule);
                mockRepository.remove.mockResolvedValue(existingRule);

                const result = await service.deleteDistributionRule(workspaceId, ruleId);

                expect(mockRepository.findOne).toHaveBeenCalledWith({
                    where: { workspaceId, id: ruleId },
                });
                expect(mockRepository.remove).toHaveBeenCalledWith(existingRule);
                expect(result).toEqual({ deleted: true });
            });

            it('should throw NotFoundException when rule does not exist', async () => {
                const nonExistentId = v4();

                mockRepository.findOne.mockResolvedValue(null);

                await expect(
                    service.deleteDistributionRule(workspaceId, nonExistentId)
                ).rejects.toThrow(NotFoundException);
            });
        });

        describe('FUNCTION: getAllDistributionRules', () => {
            it('should return all distribution rules with pagination', async () => {
                const mockRules = [
                    { id: v4(), workspaceId, active: true, maxConversationsPerAgent: 5 },
                    { id: v4(), workspaceId: workspaceId2, active: true, maxConversationsPerAgent: 3 },
                ];

                mockRepository.findAndCount.mockResolvedValue([mockRules, 2]);

                const result = await service.getAllDistributionRules(0, 10);

                expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                    skip: 0,
                    take: 10,
                    order: {
                        createdAt: 'DESC',
                    },
                });
                expect(result.data).toHaveLength(2);
                expect(result.total).toBe(2);
            });

            it('should handle pagination correctly', async () => {
                const mockRules = [
                    { id: v4(), workspaceId, active: true, maxConversationsPerAgent: 5 },
                ];

                mockRepository.findAndCount.mockResolvedValue([mockRules, 2]);

                const result = await service.getAllDistributionRules(1, 1);

                expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                    skip: 1,
                    take: 1,
                    order: {
                        createdAt: 'DESC',
                    },
                });
                expect(result.data).toHaveLength(1);
                expect(result.total).toBe(2);
            });

            it('should return empty result when no rules exist', async () => {
                mockRepository.findAndCount.mockResolvedValue([[], 0]);

                const result = await service.getAllDistributionRules(0, 10);

                expect(result.data).toHaveLength(0);
                expect(result.total).toBe(0);
            });
        });

        describe('FUNCTION: getActiveDistributionRules', () => {
            it('should return only active distribution rules', async () => {
                const mockActiveRules = [
                    { id: v4(), workspaceId, active: true, maxConversationsPerAgent: 5 },
                ];

                mockRepository.find.mockResolvedValue(mockActiveRules);

                const result = await service.getActiveDistributionRules();

                expect(mockRepository.find).toHaveBeenCalledWith({
                    where: { active: true },
                });
                expect(result).toHaveLength(1);
                expect(result[0].active).toBe(true);
                expect(result[0].workspaceId).toBe(workspaceId);
            });

            it('should return empty array when no active rules exist', async () => {
                mockRepository.find.mockResolvedValue([]);

                const result = await service.getActiveDistributionRules();

                expect(result).toHaveLength(0);
            });

            it('should return empty array when no rules exist', async () => {
                mockRepository.find.mockResolvedValue([]);

                const result = await service.getActiveDistributionRules();

                expect(result).toHaveLength(0);
            });
        });
    });
});