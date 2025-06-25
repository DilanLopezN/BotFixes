import 'reflect-metadata';
import { createConnection as createPostgresConnection, Repository } from 'typeorm';
import mongoose from 'mongoose';
import { ContactSchema } from '../schema/contact.schema';
import { ContactEntity } from '../../contact-v2/entities/contact.entity';

const BATCH_SIZE = 1000;
const MONGO_URI = process.env.MONGO_URI;
const POSTGRESQL_URI = process.env.POSTGRESQL_URI;

async function migrateContacts() {
    await mongoose.connect(MONGO_URI);
    const ContactMongo = mongoose.model('contact', ContactSchema);

    const total = await ContactMongo.countDocuments();
    console.log(`Total de contatos a migrar: ${total}`);

    const pgConnection = await createPostgresConnection({
        type: 'postgres',
        name: 'contact',
        url: POSTGRESQL_URI,
        entities: [ContactEntity],
        synchronize: false,
        schema: 'conversation',
    });

    const contactRepo: Repository<ContactEntity> = pgConnection.getRepository(ContactEntity);

    let migrated = 0;
    while (migrated < total) {
        const mongoContacts = await ContactMongo.find().skip(migrated).limit(BATCH_SIZE);

        console.log(
            `Migrando lote de ${mongoContacts.length} contatos (de ${migrated + 1} a ${
                migrated + mongoContacts.length
            })`,
        );

        for (const mongoContact of mongoContacts) {
            try {
                const contact = contactRepo.create({
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
                });

                await contactRepo.save(contact);
            } catch (error) {
                console.error(`Erro ao migrar contato: ${mongoContact._id}`, error);
            }
        }

        migrated += mongoContacts.length;
    }

    console.log('Migração concluída.');
    await mongoose.disconnect();
    await pgConnection.close();
}

migrateContacts().catch((err) => {
    console.error('Erro na migração:', err);
});
