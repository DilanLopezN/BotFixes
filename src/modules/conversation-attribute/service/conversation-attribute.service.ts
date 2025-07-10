import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createConnection as createPostgresConnection } from 'typeorm';
import * as Sentry from '@sentry/node';
import { MongooseAbstractionService } from './../../../common/abstractions/mongooseAbstractionService.service';
import {
    IConversationAttribute,
    ConversationAttribute,
    Attribute,
} from '../interfaces/conversation-attribute.interface';
import { ConversationAttributeService as ConversationAttributeV2Service } from '../../conversation-attribute-v2/services/conversation-attribute.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class ConversationAttributeService extends MongooseAbstractionService<ConversationAttribute> {
    constructor(
        @InjectModel('ConversationAttribute') readonly model: Model<ConversationAttribute>,
        private readonly conversationAttributeV2Service: ConversationAttributeV2Service,
        private workspaceService: WorkspacesService,
    ) {
        super(model);
    }

    getSearchFilter() {}

    getEventsData() {}

    private async isPostgresEnabled(workspaceId: string): Promise<boolean> {
        const workspace = await this.workspaceService.getModel().findOne({ _id: workspaceId });

        return workspace?.featureFlag?.enableConversationAttributeV2;
    }

    private async getWorkspaceIdByConversationId(conversationId: string): Promise<string> {
        try {
            const conn = await createPostgresConnection({
                name: 'analytics_connection',
                type: 'postgres',
                url: process.env.POSTGRESQL_URI,
                synchronize: false,
                schema: 'analytics',
            });

            const result = await conn.query(`SELECT workspace_id FROM analytics.conversation WHERE id = $1 LIMIT 1`, [
                conversationId,
            ]);

            if (!result || result.length <= 0 || !result[0].workspace_id) {
                throw new Error(`Cannot find workspaceId for conversation ${conversationId}`);
            }

            return result[0].workspace_id;
        } catch (error) {
            throw error;
        }
    }

    async _create(conversationId, newData: Attribute[], workspaceId?: string) {
        if (this.findDuplicates(newData)) {
            Sentry.captureEvent({
                message: 'ConversationAttributeService._create findDuplicates',
                extra: {
                    conversationId,
                    workspaceId,
                    newData,
                },
            });
            throw new BadRequestException('Duplicate entries found');
        }

        const conversationAttribute = new this.model({
            conversationId,
            data: newData || [],
        });

        try {
            const result = await this.create(conversationAttribute);

            try {
                if (!workspaceId) workspaceId = await this.getWorkspaceIdByConversationId(conversationId);

                const resultV2 = await this.conversationAttributeV2Service._create(
                    workspaceId,
                    conversationId,
                    newData,
                );

                if (await this.isPostgresEnabled(workspaceId)) return resultV2;
            } catch (error) {
                Sentry.captureEvent({
                    message: 'ConversationAttribute V2 - _create()',
                    extra: {
                        conversationId,
                        workspaceId,
                        newData,
                        error,
                    },
                });
            }

            return result;
        } catch (error) {
            throw error;
        }
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

    async getConversationAttributes(conversationId: string, workspaceId?: string) {
        try {
            try {
                if (await this.isPostgresEnabled(workspaceId)) {
                    if (!workspaceId) workspaceId = await this.getWorkspaceIdByConversationId(conversationId);

                    return await this.conversationAttributeV2Service.getConversationAttributes(
                        workspaceId,
                        conversationId,
                    );
                }
            } catch (error) {
                Sentry.captureEvent({
                    message: 'ConversationAttribute V2 - _create()',
                    extra: {
                        conversationId,
                        workspaceId,
                        error,
                    },
                });
            }

            return await this.model.findOne({ conversationId });
        } catch (e) {
            console.log('ConversationAttributeService.getConversationAttributes', e);
        }
    }

    async addAttributes(
        conversationId: string,
        attributes: Attribute[],
        workspaceId?: string,
    ): Promise<IConversationAttribute> {
        try {
            for (const attribute of attributes) {
                await this.upsertAttribute(conversationId, attribute);
            }

            const result = await this.model.findOne({ conversationId });

            try {
                if (!workspaceId) workspaceId = await this.getWorkspaceIdByConversationId(conversationId);

                const resultV2 = await this.conversationAttributeV2Service.addAttributes(
                    workspaceId,
                    conversationId,
                    attributes,
                );

                if (await this.isPostgresEnabled(workspaceId)) {
                    return {
                        ...resultV2,
                        id: resultV2.conversationId,
                        _id: resultV2.conversationId,
                    };
                }
            } catch (error) {
                Sentry.captureEvent({
                    message: 'ConversationAttribute V2 - _create()',
                    extra: {
                        conversationId,
                        workspaceId,
                        error,
                    },
                });
            }

            return {
                ...result.toObject(),
                id: castObjectIdToString(result._id),
                _id: castObjectIdToString(result._id),
                workspaceId,
            };
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationAttributeService.addAttributes',
                extra: {
                    error: e,
                },
            });
        }
    }

    async removeAttribute(
        conversationId: string,
        attributeName: string,
        workspaceId?: string,
    ): Promise<IConversationAttribute> {
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

            const result = await this.model.findOne({ conversationId });

            try {
                if (!workspaceId) workspaceId = await this.getWorkspaceIdByConversationId(conversationId);

                const resultV2 = await this.conversationAttributeV2Service.removeAttribute(
                    workspaceId,
                    conversationId,
                    attributeName,
                );

                if (await this.isPostgresEnabled(workspaceId)) {
                    return {
                        ...resultV2,
                        id: resultV2.conversationId,
                        _id: resultV2.conversationId,
                    };
                }
            } catch (error) {
                Sentry.captureEvent({
                    message: 'ConversationAttribute V2 - _create()',
                    extra: {
                        conversationId,
                        workspaceId,
                        error,
                    },
                });
            }

            return {
                ...result.toObject(),
                id: castObjectIdToString(result._id),
                _id: castObjectIdToString(result._id),
                workspaceId,
            };
        } catch (e) {
            console.log('ConversationAttributeService.removeAttribute', e);
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

    public async configurePartitioning(workspaceId: string) {
        return await this.conversationAttributeV2Service.configurePartitioning(workspaceId);
    }
}
