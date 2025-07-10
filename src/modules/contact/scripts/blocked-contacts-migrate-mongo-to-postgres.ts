import 'reflect-metadata';
import { createConnection as createPostgresConnection, Repository } from 'typeorm';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { BlockedContactSchema } from '../schema/blocked-contact.schema';
import { BlockedContactEntity } from '../../contact-v2/entities/blocked-contact.entity';

const BATCH_SIZE = 2_000;
const MONGO_URI = process.env.MONGO_URI;
const POSTGRESQL_URI = process.env.POSTGRESQL_URI;
const ERROR_LOG_FILE = path.join(__dirname, 'blocked-contacts-erros-lotes.log');

async function migrateBlockedContacts() {
    await mongoose.connect(MONGO_URI);
    const BlockedContactMongo = mongoose.model('blocked_contact', BlockedContactSchema);

    const total = await BlockedContactMongo.countDocuments();
    console.log(`Total de contatos bloqueados encontrados no MongoDB: ${total}`);

    const pgConnection = await createPostgresConnection({
        type: 'postgres',
        name: 'blocked_contact',
        url: POSTGRESQL_URI,
        entities: [BlockedContactEntity],
        synchronize: false,
        schema: 'conversation',
    });

    const blockedContactRepo: Repository<BlockedContactEntity> = pgConnection.getRepository(BlockedContactEntity);

    let lastId = null;
    let migrated = 0;

    while (true) {
        console.time('Mongo_');
        const query = BlockedContactMongo.find().sort({ _id: 1 }).limit(BATCH_SIZE);
        if (lastId) query.where('_id').gt(lastId);
        const mongoBlockedContacts = await query.exec();
        console.timeEnd('Mongo_');

        if (mongoBlockedContacts.length === 0) break;

        console.log(`Lote com ${mongoBlockedContacts.length} contatos bloqueados`);
        lastId = mongoBlockedContacts[mongoBlockedContacts.length - 1]._id;

        console.time('Postgres_');
        const itens = mongoBlockedContacts.map((mongoBlockedContact) =>
            blockedContactRepo.create({
                id: mongoBlockedContact._id.toString(),
                workspaceId: mongoBlockedContact.workspaceId,
                contactId: mongoBlockedContact.contactId,
                phone: mongoBlockedContact.phone,
                whatsapp: mongoBlockedContact.whatsapp,
                blockedBy: mongoBlockedContact.blockedBy,
                blockedAt: mongoBlockedContact.blockedAt,
            }),
        );

        try {
            await blockedContactRepo.save(itens);
            migrated += itens.length;
            console.log(`Lote salvo com sucesso, total migrado até agora: ${migrated}`);
        } catch (error) {
            console.error(`Erro ao salvar lote iniciado no ID: ${mongoBlockedContacts[0]._id}`, error);

            try {
                // Salva os IDs do lote que falhou em um arquivo
                const failedIds = mongoBlockedContacts.map((c) => c._id.toString()).join(',');
                const logLine = `[${new Date().toISOString()}] Falha ao salvar lote: IDs: ${failedIds}\n`;
                fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf8');
                console.log(`IDs do lote com erro salvos em ${ERROR_LOG_FILE}`);
            } catch (writeError) {
                console.error('Erro ao gravar arquivo de log:', writeError);
            }
        } finally {
            console.timeEnd('Postgres_');
        }
    }

    console.log(`Migração finalizada. Total de contatos bloqueados processados: ${migrated}.`);
    await mongoose.disconnect();
    await pgConnection.close();
}

migrateBlockedContacts().catch((err) => {
    console.error('Erro geral na execução da migração:', err);
});
