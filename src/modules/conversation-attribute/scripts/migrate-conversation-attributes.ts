import 'reflect-metadata';
import { createConnection as createPostgresConnection } from 'typeorm';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { ConversationAttributeSchema } from '../schemas/conversation-attribute.schema';
import { ConversationAttributeEntity } from '../../conversation-attribute-v2/entities/conversation-attribute.entity';

const BATCH_SIZE = 100;
const MONGO_URI = process.env.MONGO_URI;
const POSTGRESQL_URI = process.env.POSTGRESQL_URI;
const ERROR_LOG_FILE = path.join(__dirname, 'conversation-attributes-erros-lotes.log');

function clearAttrValue(attributeValue) {
    if (attributeValue && typeof attributeValue === 'string') {
        attributeValue = attributeValue.replace(/\0/g, '');
        attributeValue = attributeValue.replace(/\\u0000/g, '');
        attributeValue = attributeValue.replace(/\u0000/g, '');

        let jsonString = JSON.stringify(attributeValue);
        jsonString = jsonString.replace(/\\u0000/g, '');
        jsonString = jsonString.replace(/\u0000/g, '');
        return JSON.parse(jsonString);
    }

    return attributeValue;
}

function clearAttrName(attributeName) {
    if (attributeName && typeof attributeName === 'string') {
        attributeName = attributeName.replace(/\0/g, '');
        attributeName = attributeName.replace(/\\u0000/g, '');
        attributeName = attributeName.replace(/\u0000/g, '');

        let jsonString = JSON.stringify(attributeName);
        jsonString = jsonString.replace(/\\u0000/g, '');
        jsonString = jsonString.replace(/\u0000/g, '');
        attributeName = JSON.parse(jsonString);

        if (attributeName.length > 255) {
            attributeName = attributeName.slice(0, 255);
        }

        return attributeName;
    }

    return attributeName;
}

async function migrateConversationAttributes() {
    console.log('Iniciando migração de atributos de conversa...');

    await mongoose.connect(MONGO_URI);

    const ConversationAttributeMongo = mongoose.model(
        'ConversationAttribute',
        ConversationAttributeSchema,
        'conversationattributes',
    );

    const pgConnectionAnalytics = await createPostgresConnection({
        name: 'analytics_connection',
        type: 'postgres',
        url: POSTGRESQL_URI,
        entities: [],
        synchronize: false,
        schema: 'analytics',
        extra: {
            max: 5,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
        },
    });

    const pgConnectionConversation = await createPostgresConnection({
        name: 'conversation_connection',
        type: 'postgres',
        url: POSTGRESQL_URI,
        entities: [ConversationAttributeEntity],
        synchronize: false,
        schema: 'conversation',
        extra: {
            max: 5,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
        },
    });

    async function getWorkspaceIdByConversation(conversationId: string): Promise<string | null> {
        try {
            const result = await pgConnectionAnalytics.query(
                `SELECT workspace_id FROM "analytics"."conversation" WHERE id = $1 LIMIT 1`,
                [conversationId],
            );

            if (result && result.length > 0 && result[0].workspace_id) {
                return result[0].workspace_id;
            }

            return null;
        } catch (error) {
            console.log(`Erro ao buscar workspaceId para conversationId ${conversationId}:`, error.message);
            return null;
        }
    }

    let lastId = null;
    let migrated = 0;

    while (true) {
        const query = ConversationAttributeMongo.find().sort({ _id: 1 }).limit(BATCH_SIZE);
        if (lastId) query.where('_id').gt(lastId);
        const mongoAttributes = await query.exec();

        if (mongoAttributes.length === 0) break;

        lastId = mongoAttributes[mongoAttributes.length - 1]._id;

        const itens = [];

        try {
            for (const mongoAttribute of mongoAttributes) {
                const conversationId = mongoAttribute.conversationId?.toString();
                const workspaceId = await getWorkspaceIdByConversation(conversationId);
                if (!conversationId || !workspaceId) continue;

                if (!Array.isArray(mongoAttribute.data) || mongoAttribute.data.length === 0) continue;

                for (const attribute of mongoAttribute.data) {
                    if (attribute.name) {
                        itens.push({
                            workspaceId: workspaceId,
                            conversationId: conversationId,
                            attributeName: clearAttrName(attribute.name),
                            attributeValue: clearAttrValue(attribute.value),
                            attributeLabel: attribute.label || null,
                            attributeType: attribute.type || null,
                        });
                    }
                }
            }

            if (itens.length < 1) continue;

            // Remove duplicados no mesmo lote
            const uniqueKeys = new Set();
            const uniqueItems = itens.filter((item) => {
                const key = `${item.workspaceId}-${item.conversationId}-${item.attributeName}`;
                if (uniqueKeys.has(key)) return false;
                uniqueKeys.add(key);
                return true;
            });

            if (uniqueItems.length < 1) continue;

            const placeholders = uniqueItems
                .map((_, index) => {
                    const offset = index * 6;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${
                        offset + 6
                    })`;
                })
                .join(', ');

            await pgConnectionConversation.query(
                `
                INSERT INTO "conversation"."conversation_attribute" 
                (workspace_id, conversation_id, attribute_name, attribute_value, attribute_label, attribute_type)
                VALUES ${placeholders}
                ON CONFLICT (workspace_id, conversation_id, attribute_name) 
                DO UPDATE SET 
                    attribute_value = EXCLUDED.attribute_value,
                    attribute_label = EXCLUDED.attribute_label,
                    attribute_type = EXCLUDED.attribute_type
            `,
                uniqueItems.flatMap((item) => [
                    item.workspaceId,
                    item.conversationId,
                    item.attributeName,
                    JSON.stringify(item.attributeValue),
                    item.attributeLabel,
                    item.attributeType,
                ]),
            );

            migrated += mongoAttributes.length;
        } catch (error) {
            console.error(`Erro ID: ${mongoAttributes[0]._id}`, error);

            try {
                const failedIds = mongoAttributes.map((c) => c._id.toString()).join(',');
                const logLine = `[${new Date().toISOString()}] Falha ao salvar lote: IDs: ${failedIds}\n`;
                fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf8');
            } catch (writeError) {}
        }
    }

    console.log(`Migração finalizada. Total de documentos processados: ${migrated}`);

    await mongoose.disconnect();
    await pgConnectionAnalytics.close();
    await pgConnectionConversation.close();
}

migrateConversationAttributes().catch((err) => {
    console.log('Erro fatal na migração:', err);
    process.exit(1);
});
