import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorkspaceChannels, WorkspaceChannelSpecification } from '../models/workspace-channel-specification.entity';
import { CreateWorkspaceChannelSpecification } from '../dto/workspace-channel-specification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BILLING_CONNECTION } from '../ormconfig';
import { CatchError } from '../../auth/exceptions';

@Injectable()
export class WorkspaceChannelSpecificationService {
    constructor(
        @InjectRepository(WorkspaceChannelSpecification, BILLING_CONNECTION)
        private workspaceChannelSpecificationRepository: Repository<WorkspaceChannelSpecification>,
    ) {}

    defaultChannelSpecifications(workspaceId: string): CreateWorkspaceChannelSpecification[] {
        return [
            {
                channelId: WorkspaceChannels.api,
                conversationExcededPrice: 0,
                conversationLimit: 0,
                messageExcededPrice: 0,
                messageLimit: 0,
                workspaceId: workspaceId,
            },
            {
                channelId: WorkspaceChannels.campaign,
                conversationExcededPrice: 0,
                conversationLimit: 0,
                messageExcededPrice: 0,
                messageLimit: 0,
                workspaceId: workspaceId,
            },
            {
                channelId: WorkspaceChannels.gupshup,
                conversationExcededPrice: 0,
                conversationLimit: 0,
                messageExcededPrice: 0,
                messageLimit: 0,
                workspaceId: workspaceId,
            },
            {
                channelId: WorkspaceChannels.liveagent,
                conversationExcededPrice: 0,
                conversationLimit: 0,
                messageExcededPrice: 0,
                messageLimit: 0,
                workspaceId: workspaceId,
            },
            {
                channelId: WorkspaceChannels.webchat,
                conversationExcededPrice: 0,
                conversationLimit: 0,
                messageExcededPrice: 0,
                messageLimit: 0,
                workspaceId: workspaceId,
            },
        ];
    }

    @CatchError()
    async getWorkspaceChannelSpecificationByWorkspaceId(workspaceId: string): Promise<WorkspaceChannelSpecification[]> {
        return await this.workspaceChannelSpecificationRepository
            .createQueryBuilder()
            .where('workspace_id = :workspaceId', { workspaceId })
            .getMany();
    }

    @CatchError()
    async create(data: CreateWorkspaceChannelSpecification): Promise<WorkspaceChannelSpecification> {
        return await this.workspaceChannelSpecificationRepository.save({ ...data });
    }

    @CatchError()
    async update(data: WorkspaceChannelSpecification): Promise<any> {
        return await this.workspaceChannelSpecificationRepository.update(
            { id: data.id },
            {
                conversationLimit: data.conversationLimit,
                conversationExcededPrice: data.conversationExcededPrice,
                messageLimit: data.messageLimit,
                messageExcededPrice: data.messageExcededPrice,
            },
        );
    }
}
