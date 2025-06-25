import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, UpdateResult } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { CampaignContact } from '../../campaign/models/campaign-contact.entity';
import { Contact } from '../../campaign/models/contact.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { CreateContactParams } from '../interfaces/create-contact.interface';
import { ContactAttribute } from '../../campaign/models/contact-attribute.entity';
import { ContactResume } from '../../campaign/interfaces/campaign-resume.interface';
import { ExternalDataService } from './external-data.service';

export class ContactService {
    constructor(
        @InjectRepository(Contact, CAMPAIGN_CONNECTION)
        private contactRepository: Repository<Contact>,
        private readonly externalDataService: ExternalDataService,
    ) {}

    @CatchError()
    async getCampaignContacts(campaignId: number, onlyInvalidContacts?: boolean): Promise<Contact[]> {
        const query = this.contactRepository
            .createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId },
            )
            .leftJoinAndMapMany(
                'contact.contactAttributes',
                ContactAttribute,
                'attr',
                'attr.contact_id = contact.id AND attr.campaign_id = cmpCntct.campaign_id',
            );

        if (onlyInvalidContacts) {
            query.andWhere('cmpCntct.invalid = true');
        }

        const contacts = await query.getMany();

        return await this.externalDataService.addConversationIdsInContacts(contacts);
    }

    @CatchError()
    async getCampaignContactsResume(campaignId: number): Promise<ContactResume> {
        const contactCount = await this.contactRepository
            .createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId },
            )
            .getCount();

        const processedContactCount = await this.contactRepository
            .createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId },
            )
            .where('cmpCntct.send_at > 0')
            .andWhere('cmpCntct.send_at IS NOT NULL')
            .andWhere('cmpCntct.invalid IS NULL')
            .getCount();
        return { processedContactCount, contactCount };
    }

    @CatchError()
    async createContact(data: CreateContactParams, transactionalEntityManager?: EntityManager): Promise<Contact> {
        const contactData = { ...data, isValid: false };
        if (!transactionalEntityManager) return this.contactRepository.save(contactData);
        const contact = this.contactRepository.create(contactData);
        return await transactionalEntityManager.save(contact);
    }

    @CatchError()
    async getWorkspaceContactByPhoneNumber(workspaceId: string, phone: string): Promise<Contact> {
        return await this.contactRepository.findOne({
            workspaceId,
            phone,
        });
    }

    @CatchError()
    async updateContactName(
        workspaceId: string,
        data: Partial<Contact>,
        transactionalEntityManager?: EntityManager,
    ): Promise<UpdateResult> {
        const updateData = { name: data.name };

        if (!transactionalEntityManager) {
            return await this.contactRepository.update({ id: data.id, workspaceId }, updateData);
        }

        return await transactionalEntityManager.update(Contact, { id: data.id, workspaceId }, updateData);
    }

    @CatchError()
    async deleteContactsByIds(contactIds: number[], transactionalEntityManager?: EntityManager): Promise<void> {
        if (contactIds.length === 0) return;

        const contactRepo = transactionalEntityManager
            ? transactionalEntityManager.getRepository(Contact)
            : this.contactRepository;

        await contactRepo.createQueryBuilder().delete().from(Contact).whereInIds(contactIds).execute();
    }
}
