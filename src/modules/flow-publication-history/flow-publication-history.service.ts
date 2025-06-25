import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import { CreatePublicationFlowHistory } from './interface/create-publication-flow-history.interface';
import { FlowPublicationHistory } from './interface/health-publication-flow-history.interface';

@Injectable()
export class FlowPublicationHistoryService {
    constructor(@InjectModel('FlowPublicationHistory') protected readonly model: Model<FlowPublicationHistory>) {}

    public getModel() {
        return this.model;
    }

    public async create({ integrationId, workspaceId, userId }: CreatePublicationFlowHistory) {
        return await this.model.create({
            integrationId,
            workspaceId,
            userId,
            publishedAt: moment().valueOf(),
            _id: new Types.ObjectId(),
        });
    }

    public async getLastPublicationByIntegrationId(integrationId: string) {
        return await this.model
            .findOne({
                integrationId,
            })
            .sort({ publishedAt: 'desc' });
    }
}
