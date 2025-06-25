import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { FlowHistory } from '../../interfaces/health/health-flow-history.interface';
import { HealthFlow } from 'kissbot-core';

@Injectable()
export class FlowHistoryService {
    constructor(@InjectModel('FlowHistory') protected readonly model: Model<FlowHistory>) {}

    public getModel() {
        return this.model;
    }

    public async bulkCreate(userId: string, flows: HealthFlow[]) {
        if (!flows?.length) {
            return;
        }

        const flowsInserts = [];

        for (const flow of flows) {
            flowsInserts.push({
                flow,
                flowId: flow._id,
                updatedByUserId: userId,
                integrationId: flow.integrationId,
                workspaceId: flow.workspaceId,
                createdAt: moment().valueOf(),
            });
        }

        await this.model.insertMany(flowsInserts);
    }
}
