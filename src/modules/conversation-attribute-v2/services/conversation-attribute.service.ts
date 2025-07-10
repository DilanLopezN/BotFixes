import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/node';
import { ConversationAttributeEntity } from '../entities/conversation-attribute.entity';
import { CONVERSATION_ATTRIBUTE } from '../ormconfig';
import { ConversationAttribute, Attribute } from '../interfaces/conversation-attribute.interface';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class ConversationAttributeService {
    constructor(
        @InjectRepository(ConversationAttributeEntity, CONVERSATION_ATTRIBUTE)
        private repository: Repository<ConversationAttributeEntity>,
    ) {}

    public async _create(
        workspaceId: string,
        conversationId: string,
        attributes: Attribute[],
    ): Promise<ConversationAttribute> {
        workspaceId = castObjectIdToString(workspaceId);
        conversationId = castObjectIdToString(conversationId);
        attributes = this.removeDuplicatesAndOverwrite(attributes);

        if (!attributes || attributes.length === 0) {
            return {
                conversationId,
                workspaceId,
                data: [],
            };
        }

        if (this.hasDuplicates(attributes)) {
            Sentry.captureEvent({
                message: 'ConversationAttributeService._create findDuplicates',
                extra: {
                    conversationId,
                    workspaceId,
                    attributes,
                },
            });
            throw new BadRequestException('Duplicate entries found');
        }

        try {
            await this.repository
                .createQueryBuilder()
                .insert()
                .into(ConversationAttributeEntity)
                .values(
                    attributes
                        .filter((attribute) => attribute.name)
                        .map((attribute) => ({
                            conversationId,
                            workspaceId,
                            attributeName: attribute.name,
                            attributeValue: attribute.value,
                            attributeLabel: attribute.label,
                            attributeType: attribute.type,
                        })),
                )
                .orUpdate(
                    ['attribute_value', 'attribute_label', 'attribute_type'],
                    ['workspace_id', 'conversation_id', 'attribute_name'],
                )
                .execute();

            const result = await this.repository.find({ where: { conversationId, workspaceId } });
            const conversationAttribute: ConversationAttribute = {
                conversationId,
                workspaceId,
                data: result.map((entity) => ({
                    name: entity.attributeName,
                    value: entity.attributeValue,
                    label: entity.attributeLabel,
                    type: entity.attributeType,
                })),
            };

            return conversationAttribute;
        } catch (error) {
            throw error;
        }
    }

    private hasDuplicates(attributes: Attribute[]): boolean {
        const findDuplicates = attributes.filter(
            (attribute, attributeIndex) =>
                attributes.findIndex((attributeToCheck, attributeToCheckIndex) => {
                    const hasSameName = attribute.name == attributeToCheck.name;
                    const hasSameIndex = attributeToCheckIndex != attributeIndex;

                    if (hasSameName && hasSameIndex) return true;

                    return false;
                }) > -1,
        );

        return findDuplicates.length > 0;
    }

    public async getConversationAttributes(
        workspaceId: string,
        conversationId: string,
    ): Promise<ConversationAttribute> {
        workspaceId = castObjectIdToString(workspaceId);
        conversationId = castObjectIdToString(conversationId);

        try {
            const results = await this.repository.find({
                where: {
                    conversationId,
                    workspaceId,
                },
            });

            const conversationAttribute: ConversationAttribute = {
                conversationId,
                workspaceId,
                data: results.map((entity) => ({
                    name: entity.attributeName,
                    value: entity.attributeValue,
                    label: entity.attributeLabel,
                    type: entity.attributeType,
                })),
            };

            return conversationAttribute;
        } catch (error) {
            console.log('ConversationAttributeService.getConversationAttributes', error);

            return null;
        }
    }

    private removeDuplicatesAndOverwrite(attributes: Attribute[]): Attribute[] {
        if (!attributes?.length) {
            return [];
        }

        const uniqueByName = new Map<string, Attribute>();

        for (const attr of attributes) {
            uniqueByName.set(attr.name, attr);
        }

        const uniqueAttributes = Array.from(uniqueByName.values());
        return uniqueAttributes;
    }

    public async addAttributes(
        workspaceId: string,
        conversationId: string,
        attributes: Attribute[],
    ): Promise<ConversationAttribute> {
        workspaceId = castObjectIdToString(workspaceId);
        conversationId = castObjectIdToString(conversationId);
        attributes = this.removeDuplicatesAndOverwrite(attributes);

        if (!attributes || attributes.length === 0) {
            return this.getConversationAttributes(workspaceId, conversationId);
        }

        try {
            await this.repository
                .createQueryBuilder()
                .insert()
                .into(ConversationAttributeEntity)
                .values(
                    attributes
                        .filter((attribute) => attribute.name)
                        .map((attribute) => ({
                            conversationId,
                            workspaceId,
                            attributeName: attribute.name,
                            attributeValue: attribute.value,
                            attributeLabel: attribute.label,
                            attributeType: attribute.type,
                        })),
                )
                .orUpdate(
                    ['attribute_value', 'attribute_label', 'attribute_type'],
                    ['workspace_id', 'conversation_id', 'attribute_name'],
                )
                .execute();

            const result = await this.repository.find({ where: { conversationId, workspaceId } });

            const conversationAttribute: ConversationAttribute = {
                conversationId,
                workspaceId,
                data: result.map((entity) => ({
                    name: entity.attributeName,
                    value: entity.attributeValue,
                    label: entity.attributeLabel,
                    type: entity.attributeType,
                })),
            };

            return conversationAttribute;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public async removeAttribute(
        workspaceId: string,
        conversationId: string,
        attributeName: string,
    ): Promise<ConversationAttribute> {
        workspaceId = castObjectIdToString(workspaceId);
        conversationId = castObjectIdToString(conversationId);

        try {
            await this.repository.delete({
                conversationId,
                workspaceId,
                attributeName,
            });

            const results = await this.repository.find({
                where: {
                    conversationId,
                    workspaceId,
                },
            });

            const conversationAttribute: ConversationAttribute = {
                conversationId,
                workspaceId,
                data: results.map((entity) => ({
                    name: entity.attributeName,
                    value: entity.attributeValue,
                    label: entity.attributeLabel,
                    type: entity.attributeType,
                })),
            };

            return conversationAttribute;
        } catch (error) {
            throw error;
        }
    }

    public async configurePartitioning(workspaceId: string) {
        try {
            const partitionName = `conversation_attribute_${workspaceId.replace(/-/g, '_').toLowerCase()}`;

            const checkPartitionQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = $1 AND n.nspname = 'conversation'
            );
        `;
            const res = await this.repository.query(checkPartitionQuery, [partitionName]);
            const partitionExists = res[0].exists;

            if (!partitionExists) {
                const createPartitionQuery = `
                CREATE TABLE conversation.${partitionName}
                PARTITION OF conversation.conversation_attribute
                FOR VALUES IN ('${workspaceId}');
            `;
                await this.repository.query(createPartitionQuery);
                console.log(`Partição 'conversation.${partitionName}' criada com sucesso.`);
            }
        } catch (error) {
            console.error(`Erro ao verificar ou criar partição para '${workspaceId}':`, error);
            throw error;
        }
    }
}
