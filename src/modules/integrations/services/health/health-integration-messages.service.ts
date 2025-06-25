import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
    CreateIntegrationMessage,
    HealthIntegrationMessages,
} from '../../interfaces/health/health-integration-messages.interface';
import { Model } from 'mongoose';
import { castObjectId } from '../../../../common/utils/utils';
import * as moment from 'moment';
import { pick } from 'lodash';

@Injectable()
export class HealthIntegrationMessagesService {
    constructor(
        @InjectModel('HealthIntegrationMessages') protected readonly model: Model<HealthIntegrationMessages & Document>,
    ) {}

    public async createIntegrationMessage(message: CreateIntegrationMessage) {
        return await this.model.create(message);
    }

    public async deleteIntegrationMessage(integrationId: string, integrationMessageId: string) {
        const result = await this.model.deleteOne({
            _id: castObjectId(integrationMessageId),
            integrationId: castObjectId(integrationId),
        });

        return {
            ok: result.deletedCount > 0,
        };
    }

    public async listIntegrationMessage(
        workspaceId: string,
        integrationId: string,
    ): Promise<HealthIntegrationMessages[]> {
        return await this.model
            .find({
                workspaceId: castObjectId(workspaceId),
                integrationId: castObjectId(integrationId),
            })
            .sort({
                createdAt: -1,
            });
    }

    public async listIntegrationMessagesByWorkspaceId(workspaceId: string): Promise<{
        [integrationId: string]: {
            messagesCount: number;
            // criado nas últimas 24h
            newMessagesCount: number;
        };
    }> {
        const result = await this.model.aggregate([
            {
                $match: {
                    workspaceId: { $eq: castObjectId(workspaceId) },
                },
            },
            {
                $group: {
                    _id: '$integrationId',
                    messagesCount: { $sum: 1 },
                    newMessagesCount: {
                        $sum: { $cond: [{ $lte: ['$createdAt', moment().subtract(24, 'hours').valueOf()] }, 0, 1] },
                    },
                },
            },
        ]);

        return result.reduce((acc, current) => {
            acc[current._id] = pick(current, ['messagesCount', 'newMessagesCount']);
            return acc;
        }, {});
    }
}
