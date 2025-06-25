import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { MongooseAbstractionService } from '../../common/abstractions/mongooseAbstractionService.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BotAttribute, EntityAttribute } from './interfaces/botAttribute.interface';
import { castObjectId, castObjectIdToString } from '../../common/utils/utils';
import { EntitiesService } from '../entities/entities.service';
import { Entity } from '../entities/interfaces/entity.interface';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { Exceptions } from '../../modules/auth/exceptions';

@Injectable()
export class BotAttributesService extends MongooseAbstractionService<
BotAttribute
> {
    constructor(
        @InjectModel('BotAttributes')
        protected readonly repository: Model<BotAttribute>,
        @Inject(forwardRef(() => EntitiesService))
        private readonly entitiesService: EntitiesService,
    ) {
        super(repository);
    }

    getSearchFilter(search: string): any { }
    getEventsData() { }

    findByInteractionIdAndBotId(interactionId, botId) {
        return this.repository.find({
            interactions: {
                $in: [castObjectId(interactionId)],
            },
            botId: castObjectId(botId),
            deletedAt: undefined,
        }).exec();
    }

    deleteByInteractionIdAndBotId(interactionId, botId) {
        return this.repository.updateMany({
            botId: castObjectId(botId),
            interactions: { $in: [interactionId] },
        }, {
            $pull: { interactions: interactionId },
        }).exec();
    }

    async _getAll(botId, query: QueryStringFilter, workspaceId?) {
        const attributes: any = await this.queryPaginate(query);
        let entityAttributes: Array<EntityAttribute> = [];
        if (workspaceId) {
            entityAttributes = await this.getEntitiesAttributes(workspaceId);
        }
        const defaultAttributes = this.getDefaultBotAttributes();
        attributes.data = [...attributes.data, ...defaultAttributes, ...entityAttributes] as Array<BotAttribute & { _id: ObjectId }>;
        return attributes;
    }

    async _create(newBotAttribute: BotAttribute, botId: string) {
        const botAttrList = (await this._getAll(botId, {
            filter: {
                botId,
            },
        }));

        if (new Set(newBotAttribute.interactions).size !== newBotAttribute.interactions.length) {
            return Exceptions.DUPLICATED_ITEMS_INTERACTIONID;
        }

        const botAttributeExists = botAttrList.data
            .some((botAttr: BotAttribute) => botAttr.name == newBotAttribute.name);

        if (!botAttributeExists) {
            return await this.create(newBotAttribute);
        }

        const attrToUpdate = await this.findOne({ name: newBotAttribute.name });

        attrToUpdate.interactions = [...attrToUpdate.interactions, ...newBotAttribute.interactions];
        return await this.update(castObjectIdToString(attrToUpdate._id), attrToUpdate);
    }

    getDefaultBotAttributes(): Array<any> {
        return [
            { name: 'default_bot' },
            { name: 'default_channel' },
            { name: 'default_date' },
            { name: 'default_id' },
            { name: 'default_phone' },
            { name: 'default_score' },
            { name: 'default_interaction' },
            { name: 'default_language' },
            { name: 'default_date' },
            { name: 'default_timestamp' },            
            { name: 'default_hours' },
            { name: 'default_period' },
            { name: 'default_last_interaction' },
            { name: 'default_message' },
            { name: 'default_has_messages' },
            { name: 'default_content_type' },
            { name: 'default_has_attachments' },
            { name: 'default_is_attachment' },            
            { name: 'default_is_image' },
            { name: 'default_is_video' },
            { name: 'default_is_audio' },
            { name: 'default_is_document' },
            { name: 'default_weekday' },
            { name: 'default_channel_token' },
        ];
    }

    /**
     * Função para retornar os attributes das entities do workspace
     * @param workspaceId
     */
    async getEntitiesAttributes(workspaceId: string): Promise<Array<EntityAttribute>> {
        const entities: Array<Entity> = await this.entitiesService.getAll({
            workspaceId,
        });
        const entityAttributes: Array<EntityAttribute> = [];
        entities.forEach(entity => {
            entity.entityAttributes.forEach(attr => {
                entityAttributes.push({
                    name: attr.name,
                    type: attr.type,
                    fromEntity: true,
                });
            });
        });
        return entityAttributes;
    }

    public async _delete(botAttributeId: string) {
        const botAttribute = await this.getOne(botAttributeId);

        if (botAttribute?.interactions.length !== 0) {
            return Exceptions.CANNOT_DELETE_ATTRIBUTE_IN_USE;
        }

        return await this.delete(botAttributeId);
    }

    public async transform(botId: string) {
        const attributes = await this.getAll({ botId });
        const attrsToUpdate = [];

        const duplicateds = attributes
            .reduce((a, b) => ({
                ...a,
                [b.name]: (a[b.name] || 0) + 1,
            }), {});

        attributes.map((attr: BotAttribute) => {
            let attribute;

            if (attr.interactionId !== null && duplicateds[attr.name] === 1 && attr.interactions.length === 0) {
                attribute = {
                    ...attr.toJSON({minimize: false}),
                    interactions: [attr.interactionId + ''],
                    interactionId: undefined,
                };
                attrsToUpdate.push(this.model.updateOne({ _id: attr._id }, attribute));
            }
        });

        return await Promise.all(attrsToUpdate);
    }
}
