import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WHATSAPP_FLOW_CONNECTION } from '../ormconfig';
import { FlowData } from '../models/flow-data.entity';
import { Flow } from '../models/flow.entity';

@Injectable()
export class FlowDataService {
    private readonly logger = new Logger(FlowDataService.name);

    constructor(
        @InjectRepository(FlowData, WHATSAPP_FLOW_CONNECTION)
        private repository: Repository<FlowData>,
    ) {}

    async create(data: { workspaceId: string; flowId: number; data: any; flowScreen: string; name: string }) {
        return await this.repository.save({
            data: data.data,
            flowId: data.flowId,
            flowScreen: data.flowScreen,
            name: data.name,
            workspaceId: data.workspaceId,
        });
    }

    async updateDataByFlowId(flowId: number, data: any) {
        return await this.repository.update(
            { flowId: flowId },
            {
                data: data,
            },
        );
    }

    async getFlowDataByWorkspaceIdAndFlow(workspaceId: string) {
        const result = await this.repository
            .createQueryBuilder('flowData')
            .innerJoinAndMapOne('flowData.flow', Flow, 'flow', 'flowData.flowId = flow.id')
            .where('flowData.workspaceId = :workspaceId', { workspaceId })
            .getMany();

        return { data: result };
    }

    async getFlowDataByWorkspaceIdAndFlowId(workspaceId: string, flowId: number) {
        const result = await this.repository
            .createQueryBuilder('flowData')
            .innerJoin(Flow, 'flow', 'flowData.flowId = flow.id')
            .where('flowData.workspaceId = :workspaceId', { workspaceId })
            .andWhere('flowData.flow_id = :flowId', { flowId: flowId })
            .getMany();

        return { data: result };
    }

    async getFlowDataByIdAndFlow(id: number) {
        const result = await this.repository
            .createQueryBuilder('flowData')
            .innerJoinAndMapOne('flowData.flow', Flow, 'flow', 'flowData.flowId = flow.id')
            .where('flowData.id = :id', { id })
            .getOne();
        return { data: result };
    }

    async getFlowDataByWorkspaceIdAndId(workspaceId: string, id: number) {
        const result = await this.repository
            .createQueryBuilder('flowData')
            .innerJoinAndMapOne('flowData.flow', Flow, 'flow', 'flowData.flowId = flow.id')
            .where('flowData.workspaceId = :workspaceId', { workspaceId })
            .andWhere('flowData.id = :id', { id })
            .getOne();
        return { data: result };
    }

    async getFlowDataById(id: number) {
        const result = await this.repository.findOne(id);

        return { data: result };
    }
}
