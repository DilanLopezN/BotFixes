import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from './../../auth/exceptions';
import { Repository } from 'typeorm';
import { BillingType, Workspace } from '../models/workspace.entity';
import { BILLING_CONNECTION } from '../ormconfig';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import * as moment from 'moment';
import {
    CreateWorkspaceChannelSpecification,
    WorkspaceChannelSpecification,
} from '../dto/workspace-channel-specification.dto';
import { WorkspaceChannelSpecificationService } from './workspace-channel-specification.service';
import { Account } from '../models/account.entity';

@Injectable()
export class WorkspaceService {
    private readonly logger = new Logger(WorkspaceService.name);
    constructor(
        @InjectRepository(Workspace, BILLING_CONNECTION)
        private workspaceRepository: Repository<Workspace>,
        private readonly workspaceChannelSpecificationService: WorkspaceChannelSpecificationService,
    ) {}

    @CatchError()
    getOneByIdAndAccount(workspaceId: string, accountId: number) {
        return this.workspaceRepository
            .createQueryBuilder()
            .where('id = :id', { id: workspaceId })
            .andWhere('account_id = :accountId', { accountId })
            .getOne();
    }

    @CatchError()
    getOneByIdAndVinculedAccount(workspaceId: string) {
        return this.workspaceRepository
            .createQueryBuilder('w')
            .where('w.id = :id', { id: workspaceId })
            .leftJoinAndMapOne('w.account', Account, 'ac', 'w.account_id = ac.id')
            .select(['w', 'ac.registrationId', 'ac.legalName', 'ac.company', 'ac.id'])
            .getOne();
    }

    /**
     * São workspaces onde start_at < now
     * @returns Promise<Workspace[]>
     */
    @CatchError()
    getActiveWorkspaces(): Promise<Workspace[]> {
        const startAt = moment().valueOf();
        return this.workspaceRepository
            .createQueryBuilder()
            .where('start_at < :startAt', { startAt })
            .andWhere('active = true')
            .getMany();
    }

    @CatchError()
    async getWorkspaceIdsByAccountId(accountId: number): Promise<string[]> {
        const result: { id: string }[] = await this.workspaceRepository
            .createQueryBuilder('w')
            .select('w.id', 'id')
            .where('account_id = :accountId', { accountId })
            .getRawMany();
        return result.map((r) => r.id);
    }

    async createDefaultChannelSpecification(workspaceId: string) {
        return await Promise.all(
            this.workspaceChannelSpecificationService.defaultChannelSpecifications(workspaceId).map(async (channel) => {
                return await this.workspaceChannelSpecificationService.create(channel);
            }),
        );
    }

    @CatchError()
    async createWorkspaceBillingSpecification(
        data: CreateWorkspaceDto,
        channelSpecifications?: CreateWorkspaceChannelSpecification[],
    ) {
        let workspaceChannelSpecifications;
        let workspace;

        if (channelSpecifications?.length) {
            workspaceChannelSpecifications = await Promise.all(
                channelSpecifications.map(async (channel) => {
                    return await this.workspaceChannelSpecificationService.create({ ...channel, workspaceId: data.id });
                }),
            );
        } else {
            workspaceChannelSpecifications = await this.createDefaultChannelSpecification(data.id);
        }
        workspace = await this.workspaceRepository.save(data);

        return {
            workspace,
            workspaceChannelSpecifications,
        };
    }

    @CatchError()
    async updateWorkspaceBillingSpecification(
        data: CreateWorkspaceDto,
        workspaceId: string,
        channelSpecifications?: WorkspaceChannelSpecification[],
    ) {
        let workspaceChannelSpecifications;
        let workspace;

        if (data.billingType === BillingType.channel) {
            const existChannelSpecifications =
                await this.workspaceChannelSpecificationService.getWorkspaceChannelSpecificationByWorkspaceId(
                    workspaceId,
                );

            if (channelSpecifications?.length) {
                if (existChannelSpecifications?.length) {
                    workspaceChannelSpecifications = await Promise.all(
                        channelSpecifications.map(async (channel) => {
                            if (channel?.id) {
                                return await this.workspaceChannelSpecificationService.update(channel);
                            } else {
                                return await this.workspaceChannelSpecificationService.create({
                                    ...channel,
                                    workspaceId,
                                });
                            }
                        }),
                    );
                } else {
                    workspaceChannelSpecifications = await Promise.all(
                        channelSpecifications.map(async (channel) => {
                            return await this.workspaceChannelSpecificationService.create({ ...channel, workspaceId });
                        }),
                    );
                }
            } else {
                if (!existChannelSpecifications?.length) {
                    workspaceChannelSpecifications = await this.createDefaultChannelSpecification(workspaceId);
                }
            }
        }

        workspace = await this.workspaceRepository.update(
            { id: workspaceId },
            {
                accountId: data.accountId,
                dueDate: data.dueDate,
                plan: data.plan,
                invoiceDescription: data.invoiceDescription,
                paymentDescription: data.paymentDescription,
                planPrice: data.planPrice,
                planMessageLimit: data.planMessageLimit,
                planExceededMessagePrice: data.planExceededMessagePrice,
                planHsmMessageLimit: data.planHsmMessageLimit,
                planHsmExceedMessagePrice: data.planHsmExceedMessagePrice,
                planUserLimit: data.planUserLimit,
                planUserExceedPrice: data.planUserExceedPrice,
                startAt: data.startAt,
                planConversationExceedPrice: data.planConversationExceedPrice,
                planConversationLimit: data.planConversationLimit,
                active: data.active,
                hasIntegration: data.hasIntegration,
                segment: data.segment,
                observations: data.observations,
                billingType: data.billingType,
            },
        );

        return {
            workspaceChannelSpecifications,
            workspace,
        };
    }

    @CatchError()
    async getWorkspaceById(workspaceId: string) {
        let workspace;
        let channelSpecifications;

        workspace = await this.getOneByIdAndVinculedAccount(workspaceId);
        channelSpecifications =
            await this.workspaceChannelSpecificationService.getWorkspaceChannelSpecificationByWorkspaceId(workspaceId);

        return {
            workspace,
            channelSpecifications,
        };
    }

    @CatchError()
    async getWorkspacePlanUserLimit(workspaceId: string) {
        try {
            const response = await this.getWorkspaceById(workspaceId);
            return response?.workspace?.planUserLimit;
        } catch (e) {
            this.logger.error('workspaceId: ' + workspaceId);
            this.logger.error(e);
            throw e;
        }
    }

    @CatchError()
    async getWorkspacesNameAndId(): Promise<{ name: string; id: string }[]> {
        return await this.workspaceRepository
            .createQueryBuilder('w')
            .select('w.id', 'id')
            .addSelect('w.name', 'name')
            .getRawMany();
    }

    @CatchError()
    async updateWorkspaceName(workspaceId: string, name: string) {
        return await this.workspaceRepository.update(
            { id: workspaceId },
            {
                name: name,
            },
        );
    }

    @CatchError()
    async updateWorkspaceCustomerXSettings(
        workspaceId: string,
        customerSettings: { customerXId: string; customerXEmail: string },
    ) {
        return await this.workspaceRepository.update(
            { id: workspaceId },
            {
                customerXId: customerSettings.customerXId,
                customerXEmail: customerSettings.customerXEmail,
            },
        );
    }
}
