import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import { BotsPublicationsHistoryDto } from './dto/bot-publication-history.dto';

@Injectable()
export class BotsPublicationsHistoryService {
    constructor(@InjectModel('BotsPublicationsHistory') protected readonly model: Model<BotsPublicationsHistoryDto>) {}

    public getModel() {
        return this.model;
    }

    public async create(whoUserId: string, workspaceId: string, botId: string, comment?: string) {
        return await this.model.create({
            botId,
            workspaceId,
            comment,
            userId: whoUserId,
            publishedAt: moment().valueOf(),
            _id: new Types.ObjectId(),
        });
    }

    public async getLastPublicationByBotId(botId: string) {
        return await this.model
            .findOne({
                botId,
            })
            .sort({ publishedAt: 'desc' });
    }
}
