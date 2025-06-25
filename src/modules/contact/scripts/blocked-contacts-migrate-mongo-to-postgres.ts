import 'reflect-metadata';
import { createConnection as createPostgresConnection, Repository } from 'typeorm';
import mongoose from 'mongoose';
import { BlockedContactSchema } from '../schema/blocked-contact.schema';
import { BlockedContactEntity } from '../../contact-v2/entities/blocked-contact.entity';

const BATCH_SIZE = 1000;
const MONGO_URI = process.env.MONGO_URI;
const POSTGRESQL_URI = process.env.POSTGRESQL_URI;

async function migrateBlockedContacts() {
    await mongoose.connect(MONGO_URI);
    const ContactMongo = mongoose.model('contact', BlockedContactSchema);

    const total = await ContactMongo.countDocuments();
    console.log(`Total de contatos a migrar: ${total}`);

    const pgConnection = await createPostgresConnection({
        type: 'postgres',
        name: 'contact',
        url: POSTGRESQL_URI,
        entities: [BlockedContactEntity],
        synchronize: false,
        schema: 'conversation',
    });

    const blockedContactRepo: Repository<BlockedContactEntity> = pgConnection.getRepository(BlockedContactEntity);

    let migrated = 0;
    while (migrated < total) {
        const mongoBlockedContacts = await ContactMongo.find().skip(migrated).limit(BATCH_SIZE);

        console.log(
            `Migrando lote de ${mongoBlockedContacts.length} contatos bloqueados (de ${migrated + 1} a ${
                migrated + mongoBlockedContacts.length
            })`,
        );

        for (const mongoBlockedContact of mongoBlockedContacts) {
            try {
                const blockedContact = blockedContactRepo.create({
                    id: mongoBlockedContact._id.toString(),
                    workspaceId: mongoBlockedContact.workspaceId,
                    contactId: mongoBlockedContact.contactId,
                    phone: mongoBlockedContact.phone,
                    whatsapp: mongoBlockedContact.whatsapp,
                    blockedBy: mongoBlockedContact.blockedBy,
                    blockedAt: mongoBlockedContact.blockedAt,
                });

                await blockedContactRepo.save(blockedContact);
            } catch (error) {
                console.error(`Erro ao migrar contato: ${mongoBlockedContact._id}`, error);
            }
        }

        migrated += mongoBlockedContacts.length;
    }

    console.log('Migração concluída.');
    await mongoose.disconnect();
    await pgConnection.close();
}

migrateBlockedContacts().catch((err) => {
    console.error('Erro na migração:', err);
});
