import 'reflect-metadata';
import { createConnection as createPostgresConnection, Repository } from 'typeorm';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { ContactSchema } from '../schema/contact.schema';
import { ContactEntity } from '../../contact-v2/entities/contact.entity';

const BATCH_SIZE = 2_000;
const MONGO_URI = process.env.MONGO_URI;
const POSTGRESQL_URI = process.env.POSTGRESQL_URI;
const ERROR_LOG_FILE = path.join(__dirname, 'contacts-erros-lotes.log');

async function migrateContacts() {
    await mongoose.connect(MONGO_URI);
    const ContactMongo = mongoose.model('contact', ContactSchema);

    const total = await ContactMongo.countDocuments();
    console.log(`Total de contatos encontrados no MongoDB: ${total}`);

    const pgConnection = await createPostgresConnection({
        type: 'postgres',
        name: 'contact',
        url: POSTGRESQL_URI,
        entities: [ContactEntity],
        synchronize: false,
        schema: 'conversation',
    });

    const contactRepo: Repository<ContactEntity> = pgConnection.getRepository(ContactEntity);

    let lastId = null;
    let migrated = 0;

    while (true) {
        console.time('Mongo_');
        const query = ContactMongo.find().sort({ _id: 1 }).limit(BATCH_SIZE);
        if (lastId) query.where('_id').gt(lastId);
        const mongoContacts = await query.exec();
        console.timeEnd('Mongo_');

        if (mongoContacts.length === 0) break;

        console.log(`Lote com ${mongoContacts.length} contatos`);
        lastId = mongoContacts[mongoContacts.length - 1]._id;

        console.time('Postgres_');
        const itens = mongoContacts.map((mongoContact) =>
            contactRepo.create({
                id: mongoContact._id.toString(),
                phone: mongoContact.phone,
                ddi: mongoContact.ddi,
                whatsapp: mongoContact.whatsapp,
                telegram: mongoContact.telegram,
                email: mongoContact.email,
                name: mongoContact.name || '',
                conversations: mongoContact.conversations || [],
                webchatId: (mongoContact as any).webchatId || null,
                createdByChannel: mongoContact.createdByChannel,
                workspaceId: mongoContact.workspaceId,
                blockedBy: mongoContact.blockedBy,
                blockedAt: mongoContact.blockedAt,
            }),
        );

        try {
            await contactRepo.save(itens);
            migrated += itens.length;
            console.log(`Lote salvo com sucesso, total migrado até agora: ${migrated}`);
        } catch (error) {
            console.error(`Erro ao salvar lote iniciado no ID: ${mongoContacts[0]._id}`, error);

            try {
                // Salva os IDs do lote que falhou em um arquivo
                const failedIds = mongoContacts.map((c) => c._id.toString()).join(',');
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

    console.log(`Migração finalizada. Total de contatos processados: ${migrated}.`);
    await mongoose.disconnect();
    await pgConnection.close();
}

migrateContacts().catch((err) => {
    console.error('Erro geral na execução da migração:', err);
});
