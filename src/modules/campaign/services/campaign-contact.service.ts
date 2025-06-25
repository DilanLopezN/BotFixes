import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, In, Repository } from 'typeorm';
import { ContactService } from './contact.service';
import { CreateCampaignContactData } from '../interfaces/create-campaign-contact.interface';
import { CampaignContact } from '../models/campaign-contact.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { CampaignService } from './campaign.service';
import { ContactAttributeService } from './contact-attribute.service';
import { CacheService } from '../../_core/cache/cache.service';
import { Contact } from '../models/contact.entity';
import { ContactAttribute } from '../models/contact-attribute.entity';
import { CatchError } from '../../auth/exceptions';
import { InvalidContact } from '../interfaces/campaign-resume.interface';
import { getCompletePhone } from '../../../common/utils/utils';
import * as moment from 'moment';
import { v4 } from 'uuid';
@Injectable()
export class CampaignContactService {
    private readonly logger = new Logger(CampaignContactService.name);

    constructor(
        @InjectRepository(CampaignContact, CAMPAIGN_CONNECTION)
        private campaignContactRepository: Repository<CampaignContact>,
        private contactService: ContactService,
        private contactAttributeService: ContactAttributeService,
        @Inject(forwardRef(() => CampaignService))
        private readonly campaignService: CampaignService,
        public cacheService: CacheService,
    ) {}

    getItensProcessingCacheKey(campaignId: string) {
        return `campaign-contact-processing-${campaignId}`;
    }

    getItensProcessingTotalCacheKey(campaignId: string) {
        return `campaign-contact-processing-total-${campaignId}`;
    }

    getItensProcessedTotalCacheKey(campaignId: string) {
        return `campaign-contact-processed-total-${campaignId}`;
    }

    // private async getCompletePhone(phone: string) {
    //     // Se é com dd com ou sem 9
    //     if (phone.length === 11 || phone.length === 10) {
    //         return `55${phone}`;
    //     }
    //     return phone;
    // }

    @CatchError()
    async createCampaignContact(data: CreateCampaignContactData): Promise<CampaignContact | any> {
        const { campaignId, workspaceId } = data;

        const phone = await getCompletePhone(data.phone);
        let contact = await this.contactService.getWorkspaceContactByPhoneNumber(data.workspaceId, phone);
        if (!contact) {
            contact = await this.contactService.createContact({
                name: data.name,
                phone,
                workspaceId: workspaceId,
            });
        } else if (contact && contact.name !== data.name) {
            const newContact = {
                ...contact,
                name: data.name,
            };
            const result = await this.contactService.updateContactName(workspaceId, campaignId, newContact);

            if (result.affected > 0) {
                contact = newContact;
            }
        }

        const existingCampaignContact = await this.campaignContactRepository.count({
            contactId: contact.id,
            campaignId,
        });

        await this.createOrUpdateContactAttributes(data, contact, workspaceId, campaignId);

        if (existingCampaignContact > 0) {
            return;
        }

        try {
            await this.campaignContactRepository.save({
                contactId: contact.id,
                campaignId: campaignId,
                hash: v4(),
            });
        } catch (e) {
            if (!((e.message || '') as string).includes('duplicate key value violates unique constraint')) {
                console.log('CampaignContactService.createCampaignContact', e);
            } else {
                // console.log('Duplicou CampaignContactService.createCampaignContact');
            }
        }
    }

    async createOrUpdateContactAttributes(
        data: CreateCampaignContactData,
        contact: Contact,
        workspaceId: string,
        campaignId: number,
    ) {
        delete data.name;
        delete data.phone;
        delete data.workspaceId;
        delete data.campaignId;

        const attributes: Array<Partial<ContactAttribute>> = Object.keys(data).map((key) => {
            return {
                name: key,
                value: data[key],
                contactId: contact.id,
                workspaceId: workspaceId,
                campaignId,
            } as Partial<ContactAttribute>;
        });

        await this.contactAttributeService.createContactAttributes(attributes);
    }

    async saveContactToProcessing(data: CreateCampaignContactData) {
        const processingCacheKey = this.getItensProcessingCacheKey(`${data.campaignId}`);
        const processingTotalCacheKey = this.getItensProcessingTotalCacheKey(`${data.campaignId}`);
        const client = this.cacheService.getClient();
        await client.hset(processingCacheKey, data.phone, JSON.stringify(data));
        await client.incr(processingTotalCacheKey);
    }

    @CatchError()
    async processCampaignContact(campaignId: number) {
        const processingCacheKey = this.getItensProcessingCacheKey(`${campaignId}`);
        const processedTotalCacheKey = this.getItensProcessedTotalCacheKey(`${campaignId}`);
        const processingTotalCacheKey = this.getItensProcessingTotalCacheKey(`${campaignId}`);

        const client = this.cacheService.getClient();

        let results = await client.hrandfield(processingCacheKey, 1);

        while (results?.length) {
            for (const key of results) {
                const dataString = await client.hget(processingCacheKey, key as string);
                const data = JSON.parse(dataString);
                try {
                    await this.createCampaignContact(data);
                    await client.incr(processedTotalCacheKey);
                } catch (e) {
                    this.logger.error(`Error processing campaign contact: ${JSON.stringify(data)}`);
                    this.logger.error(`Error processing campaign contact ERROR STACK: ${e}`);
                }
                await client.hdel(processingCacheKey, key as string);
            }
            const processingTotal = await client.get(processingTotalCacheKey);
            const processedTotal = await client.get(processedTotalCacheKey);
            results = await client.hrandfield(processingCacheKey, 10);
            const finished = !results?.length;
            await this.campaignService.updateProcessingStatus(
                campaignId,
                Number(processingTotal),
                Number(processedTotal),
                finished,
            );
        }
    }

    async getCampaignContacts(campaignId: number, skip: number, limit: number) {
        const [result, total] = await this.campaignContactRepository
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
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            count: total,
            data: result,
            currentPage: skip / limit + 1,
            nextPage: null,
        };
    }

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
    async deleteCampaignContact(workspaceId: string, campaignId: number, contactId: number) {
        const contactExistWorkspace = await this.contactService.getContactByWorkspace(workspaceId, contactId);
        if (!contactExistWorkspace) return;

        return await this.campaignContactRepository.delete({
            contactId: contactId,
            campaignId: campaignId,
        });
    }

    @CatchError()
    async deleteCampaignContactBatch(
        workspaceId: string,
        campaignId: number,
        contactIds: number[],
        deleteAll?: boolean,
    ) {
        await this.contactAttributeService.deleteContactAttributeBatch(workspaceId, campaignId, contactIds, deleteAll);

        let filter: FindConditions<CampaignContact> = {
            campaignId,
            contactId: In(contactIds),
        };
        if (deleteAll) {
            filter = {
                campaignId,
            };
        }

        return await this.campaignContactRepository.delete({
            ...filter,
        });
    }

    async updateCampaignContactSendedAt(campaignContactId: number) {
        await this.campaignContactRepository.update(
            {
                id: campaignContactId,
            },
            {
                sendAt: moment().valueOf(),
            },
        );
    }

    async updateCampaignContactInvalid(hash: string, status: number) {
        if (status == -1) {
            await this.campaignContactRepository.update(
                {
                    hash,
                },
                {
                    invalid: true,
                },
            );
        }
    }
}
