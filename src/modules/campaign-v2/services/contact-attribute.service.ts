import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from './../../auth/exceptions';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { ContactAttribute } from '../../campaign/models/contact-attribute.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';

export class ContactAttributeService {
    constructor(
        @InjectRepository(ContactAttribute, CAMPAIGN_CONNECTION)
        private contactAttributeRepository: Repository<ContactAttribute>,
    ) {}

    @CatchError()
    async createContactAttributes(
        data: Partial<ContactAttribute>[],
        transactionalEntityManager?: EntityManager,
    ): Promise<ContactAttribute[]> {
        const queryRunner =
            transactionalEntityManager.getRepository(ContactAttribute) || this.contactAttributeRepository;

        let insertResult: InsertResult;
        const createdOrUpdatedAttributes: ContactAttribute[] = [];

        try {
            insertResult = await queryRunner
                .createQueryBuilder()
                .insert()
                .into(ContactAttribute)
                .values(data)
                .execute();

            const insertedIds = insertResult.identifiers.map((id) => id.id);
            const newAttributes = await queryRunner.createQueryBuilder('attr').whereInIds(insertedIds).getMany();

            createdOrUpdatedAttributes.push(...newAttributes);
        } catch (e) {
            if (!((e.message || '') as string).includes('duplicate key value violates unique constraint')) {
                console.error('ContactAttributeService.createContactAttributes', e);
                return;
            }

            await Promise.all(
                data.map(async (attribute) => {
                    await queryRunner
                        .createQueryBuilder()
                        .update(ContactAttribute)
                        .set({ value: attribute.value })
                        .where('name = :name AND contact_id = :contactId AND campaign_id = :campaignId', {
                            name: attribute.name,
                            contactId: attribute.contactId,
                            campaignId: attribute.campaignId,
                        })
                        .execute();

                    // Após a atualização, buscar o registro atualizado
                    const updatedAttribute = await queryRunner
                        .createQueryBuilder('attr')
                        .where('name = :name AND contact_id = :contactId AND campaign_id = :campaignId', {
                            name: attribute.name,
                            contactId: attribute.contactId,
                            campaignId: attribute.campaignId,
                        })
                        .getOne();

                    if (updatedAttribute) {
                        createdOrUpdatedAttributes.push(updatedAttribute);
                    }
                }),
            );
        }

        return createdOrUpdatedAttributes;
    }

    @CatchError()
    async deleteContactAttributesByCampaignId(
        campaignId: number,
        transactionalEntityManager?: EntityManager,
    ): Promise<void> {
        const contactAttributeRepo = transactionalEntityManager
            ? transactionalEntityManager.getRepository(ContactAttribute)
            : this.contactAttributeRepository;

        await contactAttributeRepo
            .createQueryBuilder()
            .delete()
            .from(ContactAttribute)
            .where('campaignId = :campaignId', { campaignId })
            .execute();
    }
}
