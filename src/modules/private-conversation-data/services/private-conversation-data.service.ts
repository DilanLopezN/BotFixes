import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from './../../../common/abstractions/mongooseAbstractionService.service';
import { PrivateConversationData } from '../interfaces/private-conversation-data.interface';

@Injectable()
export class PrivateConversationDataService extends MongooseAbstractionService<PrivateConversationData> {
    constructor (
        @InjectModel('PrivateConversationData') readonly model: Model<PrivateConversationData>,
    ) {
        super(model)
    }

    getSearchFilter(search: any) {}

    getEventsData() { }

    findOneByConversationId(conversationId: string) {
        try {
            return this.model.findOne({
                conversationId,
            })
        } catch (e) {
            console.log('PrivateConversationDataService.findOneById', e);
        }
    }
}
