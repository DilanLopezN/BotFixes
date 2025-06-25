import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from './../../../common/abstractions/mongooseAbstractionService.service';
import { ConversationAttribute, Attribute } from '../interfaces/conversation-attribute.interface';
import * as Sentry from '@sentry/node';

@Injectable()
export class ConversationAttributeService extends MongooseAbstractionService<ConversationAttribute> {
    constructor(@InjectModel('ConversationAttribute') readonly model: Model<ConversationAttribute>) {
        super(model);
    }

    getSearchFilter() {}

    getEventsData() {}

    async _create(conversationId, newData: Attribute[]) {
        if (this.findDuplicates(newData)) {
            Sentry.captureEvent({
                message: 'ConversationAttributeService._create findDuplicates', extra: {
                    conversationId,
                    newData,
                }
            });
            throw new BadRequestException('Duplicate entries finded');
        }

        const conversationAttribute = new this.model({
            conversationId,
            data: newData || [],
        });

        try {
            return await this.create(conversationAttribute);
        } catch (error) {}
    }

    private findDuplicates(arr: Attribute[]) {
        return (
            arr.filter((dataAttr, dataAttrIndex) => {
                return (
                    arr.findIndex((dataAttrToCheck, dataAttrToCheckIndex) => {
                        if (dataAttr.name == dataAttrToCheck.name && dataAttrToCheckIndex != dataAttrIndex) {
                            return true;
                        }
                        return false;
                    }) > -1
                );
            }).length > 0
        );
    }

    async getConversationAttributes(conversationId: string) {
        try {
            return await this.model.findOne({
                conversationId,
            });
        } catch (e) {
            console.log('ConversationAttributeService.getConversationAttributes', e);
        }
    }

    async addAttributes(conversationId: string, attributes: Attribute[]): Promise<ConversationAttribute> {
        try {
            for (const attribute of attributes) {
                await this.upsertAttribute(conversationId, attribute);
            }
            return await this.model.findOne({ conversationId });
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationAttributeService.addAttributes', extra: {
                    error: e
                }
            });
        }
    }

    async removeAttribute(conversationId: string, attributeName: string): Promise<ConversationAttribute> {
        try {
            await this.model.updateOne(
                {
                    conversationId,
                    'data.name': { $eq: attributeName },
                },
                {
                    $pull: { data: { name: attributeName } },
                },
            );
            return await this.model.findOne({ conversationId });
        } catch (e) {
            console.log('ConversationAttributeService.removeAttribute', e)
        }
    }

    private async upsertAttribute(conversationId: string, attr: Attribute) {
        let nModified: number = 0;
        const updatedAttribute = await this.model.updateOne(
            { conversationId, 'data.name': { $eq: attr.name } },
            {
                $set: {
                    'data.$': attr,
                },
            },
        );
        nModified = updatedAttribute.modifiedCount;
        if (nModified == 0) {
            const addedAttribute = await this.model.updateOne(
                { conversationId, 'data.name': { $ne: attr.name } },
                {
                    $addToSet: {
                        data: attr,
                    },
                },
            );
            nModified = addedAttribute.modifiedCount;
        }
        return nModified;
    }
}
