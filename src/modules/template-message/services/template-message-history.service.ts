import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { omit } from 'lodash';
import { Model, Types } from 'mongoose';
import { TemplateMessageHistory } from '../interface/template-message-history.interface';
import { TemplateMessage } from '../interface/template-message.interface';

@Injectable()
export class TemplateMessageHistoryService {
    constructor(@InjectModel('TemplateMessageHistory') protected readonly model: Model<TemplateMessageHistory>) {}

    public getModel() {
        return this.model;
    }

    public async create(whoUserId: string, templateMessage: TemplateMessage) {
        const oldTemplateMessage = omit(templateMessage?.toJSON?.({ minimize: false }) ?? templateMessage, [
            'updatedAt',
            'createdAt',
        ]) as TemplateMessageHistory;

        return await this.model.create({
            ...oldTemplateMessage,
            templateMessageId: templateMessage._id,
            updatedByUserId: whoUserId,
            _id: new Types.ObjectId(),
        });
    }
}
