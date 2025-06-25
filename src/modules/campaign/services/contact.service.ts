import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CatchError } from "../../auth/exceptions";
import { CreateContactData } from "../interfaces/create-contact.interface";
import { CampaignContact } from "../models/campaign-contact.entity";
import { ContactAttribute } from "../models/contact-attribute.entity";
import { Contact } from "../models/contact.entity";
import { CAMPAIGN_CONNECTION } from "../ormconfig";

export class ContactService {

    private readonly logger = new Logger(ContactService.name)
    constructor(
        @InjectRepository(Contact, CAMPAIGN_CONNECTION)
        private repository: Repository<Contact>,
    ) { }

    @CatchError()
    async getCampaignContacts(campaignId: number) {
        return await this.repository.createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId }
            )
            .leftJoinAndMapMany(
                'contact.contactAttributes',
                ContactAttribute,
                'attr',
                'attr.contact_id = contact.id AND attr.campaign_id = cmpCntct.campaign_id',
            )
            .andWhere('cmpCntct.send_at IS NULL')
            .getMany();
    }

    @CatchError()
    async getCampaignContactsResume(campaignId: number) {
        const contactCount = await this.repository.createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId }
            )
            .getCount();

        const processedContactCount = await this.repository.createQueryBuilder('contact')
            .innerJoinAndMapOne(
                'contact.campaignContact',
                CampaignContact,
                'cmpCntct',
                'cmpCntct.contact_id = contact.id AND cmpCntct.campaign_id = :campaignId',
                { campaignId }
            )
            .where('cmpCntct.send_at > 0')
            .andWhere('cmpCntct.send_at IS NOT NULL')
            .andWhere('cmpCntct.invalid IS NULL')
            .getCount();
        return { processedContactCount, contactCount };
    }

    @CatchError()
    async updateValidContact(workspaceId: string, phoneNumer: string, validNumber: string) {
        return await this.repository.update({
            workspaceId,
            phone: phoneNumer,
        }, {
            isValid: true,
            whatsapp: validNumber,
        })
    }

    @CatchError()
    async getWorkspaceContactByPhoneNumber(workspaceId: string, phone: string) {
        return await this.repository.findOne({
            workspaceId,
            phone,
        })
    }

    @CatchError()
    async createContact(data: CreateContactData) {
        return await this.repository.save({
            isValid: false,
            name: data.name,
            phone: data.phone,
            workspaceId: data.workspaceId,
        })
    }

    @CatchError()
    async updateContactName(workspaceId: string, campaignId: number, data: Partial<Contact>) {
        return await this.repository.update(
            {
                id: data.id,
                workspaceId: workspaceId,
            },
            {
                name: data.name,
            },
        );
    }

    @CatchError()
    async getContactByWorkspace(workspaceId: string, contactId: number) {
        return await this.repository
            .createQueryBuilder('contact')
            .where('contact.id = :contactId', { contactId })
            .andWhere('contact.workspace_id = :workspaceId', { workspaceId })
            .getOne();
    }

}