import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CampaignContact } from '../../campaign/models/campaign-contact.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { CatchError } from '../../auth/exceptions';
import { InvalidContact } from '../../campaign/interfaces/campaign-resume.interface';
import { Contact } from '../../campaign/models/contact.entity';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { CreateCampaignContactParams } from '../interfaces/create-campaign-contact.interface';
import { v4 } from 'uuid';
import { getCompletePhone } from '../../../common/utils/utils';
import { ContactService } from './contact.service';
import { ContactAttribute } from '../../campaign/models/contact-attribute.entity';
import { ContactAttributeService } from './contact-attribute.service';
import * as moment from 'moment';

@Injectable()
export class CampaignContactService {
    constructor(
        @InjectRepository(CampaignContact, CAMPAIGN_CONNECTION)
        private campaignContactRepository: Repository<CampaignContact>,
        private contactService: ContactService,
        private contactAttributeService: ContactAttributeService,
    ) {}

    @CatchError()
    async getInvalidContactList(campaignId: number): Promise<InvalidContact[]> {
        const invalidContacts: InvalidContact[] = await this.campaignContactRepository.query(`
                select * from( 
                    select count(cmpAtt.id) as total, count(cttAtt.id) as "contactTotal", cmpCtt.contact_id as "contactId" from campaign.campaign_contact as cmpCtt
                        inner join campaign.campaign_attribute as cmpAtt on cmpAtt.campaign_id = cmpCtt.campaign_id
                        left join campaign.contact_attribute as cttAtt on cttAtt.contact_id = cmpCtt.contact_id AND cttAtt.name = cmpAtt.name
                        where cmpCtt.campaign_id = ${Number(campaignId)}
                        group by cmpCtt.contact_id
                    ) as invalid_list
                where total > "contactTotal";
            `);

        return invalidContacts;
    }

    @CatchError()
    async createCampaignContact(
        data: CreateCampaignContactParams,
        transactionalEntityManager?: EntityManager,
    ): Promise<Contact> {
        const { campaignId, workspaceId } = data;

        const phone = await getCompletePhone(data.phone);
        let contact = await this.contactService.getWorkspaceContactByPhoneNumber(data.workspaceId, phone);
        if (!contact) {
            contact = await this.contactService.createContact(
                {
                    name: data.name,
                    phone,
                    workspaceId,
                },
                transactionalEntityManager,
            );
        } else if (contact?.name !== data.name) {
            const newContact = {
                ...contact,
                name: data.name,
            };
            const result = await this.contactService.updateContactName(
                workspaceId,
                newContact,
                transactionalEntityManager,
            );

            if (result.affected > 0) {
                contact = newContact;
            }
        }

        const existingCampaignContact = await this.campaignContactRepository.count({
            contactId: contact.id,
            campaignId,
        });

        contact.contactAttributes = await this.createOrUpdateContactAttributes(
            data.contactAttributes,
            contact.id,
            workspaceId,
            campaignId,
            transactionalEntityManager,
        );

        if (existingCampaignContact > 0) {
            return;
        }

        try {
            const repository = transactionalEntityManager
                ? transactionalEntityManager.getRepository(CampaignContact)
                : this.campaignContactRepository;

            await repository.save({
                contactId: contact.id,
                campaignId: campaignId,
                hash: v4(),
            });

            return contact;
        } catch (e) {
            if (!((e.message || '') as string).includes('duplicate key value violates unique constraint')) {
                console.log('CampaignContactService.createCampaignContact', e);
                return;
            }
            // console.log('Duplicou CampaignContactService.createCampaignContact');
        }
    }

    async createOrUpdateContactAttributes(
        data: Partial<ContactAttribute>[],
        contactId: number,
        workspaceId: string,
        campaignId: number,
        transactionalEntityManager?: EntityManager,
    ): Promise<ContactAttribute[]> {
        const attributes: Partial<ContactAttribute>[] = data.map((contactAttribute) => {
            return {
                name: contactAttribute.name,
                value: contactAttribute.value,
                contactId,
                workspaceId,
                campaignId,
            } as Partial<ContactAttribute>;
        });

        return await this.contactAttributeService.createContactAttributes(attributes, transactionalEntityManager);
    }

    async updateCampaignContactSendAt(campaignContactId: number) {
        await this.campaignContactRepository.update(
            {
                id: campaignContactId,
            },
            {
                sendAt: moment().valueOf(),
            },
        );
    }

    async getCampaignContacts(campaignId: number, query?: DefaultRequest<unknown>) {
        const skip = query?.skip ?? 0;
        const limit = query?.limit ?? 4;

        const queryBuilder = this.campaignContactRepository
            .createQueryBuilder('campaignContact')
            .innerJoinAndMapOne(
                'campaignContact.contact',
                Contact,
                'contact',
                'contact.id = campaignContact.contact_id',
            )
            .leftJoinAndMapMany(
                'contact.attributes',
                ContactAttribute,
                'contactAttributes',
                'contactAttributes.contact_id = campaignContact.contact_id AND campaignContact.campaign_id = contactAttributes.campaign_id',
            )
            .where('campaignContact.campaign_id = :campaignId', { campaignId })
            .orderBy('contact.name', 'ASC')
            .skip(skip);

        if (limit > 0) {
            queryBuilder.take(limit);
        }

        const [data, count] = await queryBuilder.getManyAndCount();

        return {
            count,
            data,
            currentPage: skip / limit + 1,
            nextPage: null,
        };
    }

    async deleteCampaignContacts(campaignId: number, transactionalEntityManager?: EntityManager): Promise<void> {
        const campaignContactRepo = transactionalEntityManager
            ? transactionalEntityManager.getRepository(CampaignContact)
            : this.campaignContactRepository;

        const contactsToDelete = await campaignContactRepo
            .createQueryBuilder('campaignContact')
            .select('campaignContact.contactId')
            .where('campaignContact.campaignId = :campaignId', { campaignId })
            .getMany();

        const contactIds = contactsToDelete.map((contact) => contact.contactId);

        if (contactIds.length > 0) {
            await this.contactAttributeService.deleteContactAttributesByCampaignId(
                campaignId,
                transactionalEntityManager,
            );
            await this.contactService.deleteContactsByIds(contactIds, transactionalEntityManager);
        }

        await campaignContactRepo
            .createQueryBuilder()
            .delete()
            .from(CampaignContact)
            .where('campaignId = :campaignId', { campaignId })
            .execute();
    }

    async getInvalidOrUnsentContactsCount(campaignId: number): Promise<number> {
        const invalidOrUnsentContactCount = await this.campaignContactRepository
            .createQueryBuilder('cmpCntct')
            .where('cmpCntct.campaign_id = :campaignId', { campaignId })
            .andWhere('(cmpCntct.invalid = true OR cmpCntct.send_at IS NULL OR cmpCntct.received_at IS NULL)')
            .getCount();
        return invalidOrUnsentContactCount;
    }

    async updateCampaignContactReceived(hash: string, receivedAt: number) {
        if (receivedAt) {
            await this.campaignContactRepository.update(
                {
                    hash,
                },
                {
                    receivedAt,
                },
            );
        }
    }
}
