import { InjectRepository } from "@nestjs/typeorm";
import { CatchError } from "./../../auth/exceptions";
import { FindConditions, In, Repository } from "typeorm";
import { ContactAttribute } from "../models/contact-attribute.entity";
import { CAMPAIGN_CONNECTION } from "../ormconfig";

export class ContactAttributeService {
    constructor(
        @InjectRepository(ContactAttribute, CAMPAIGN_CONNECTION)
        private contactAttributeRepository: Repository<ContactAttribute>,
    ) {}

    async createContactAttributes(data: Array<Partial<ContactAttribute>>): Promise<ContactAttribute | any> {
        try {
            return this.contactAttributeRepository
                .createQueryBuilder()
                .insert()
                .values(data)
                .orUpdate({
                    conflict_target: ['name', 'contact_id', 'campaign_id'],
                    overwrite: ['value'],
                })
                .execute();
        } catch (e) {
            if (!((e.message || '') as string).includes('duplicate key value violates unique constraint')) {
                console.log('ContactAttributeService.createContactAttributes', e);
            } else {
                // console.log('Duplicou ContactAttributeService.createContactAttributes');
            }
        }
    }

    @CatchError()
    async updateContactAttribute(workspaceId: string, campaignId: number, data: Partial<ContactAttribute>) {
        return await this.contactAttributeRepository.update(
            {
                id: data.id,
                contactId: data.contactId,
                name: data.name,
                workspaceId: workspaceId,
                campaignId,
            },
            {
                value: data.value,
            },
        );
    }

    @CatchError()
    async createContactAttribute(workspaceId: string, campaignId: number, data: Partial<ContactAttribute>) {
        return await this.contactAttributeRepository.save({
            contactId: data.contactId,
            value: data.value,
            name: data.name,
            workspaceId,
            campaignId,
        });
    }

    @CatchError()
    async deleteContactAttributeBatch(
        workspaceId: string,
        campaignId: number,
        contactIds: number[],
        deleteAll?: boolean,
    ) {
        let filter: FindConditions<ContactAttribute> = {
            workspaceId,
            campaignId,
            contactId: In(contactIds),
        };
        if (deleteAll) {
            filter = {
                workspaceId,
                campaignId,
            };
        }

        return await this.contactAttributeRepository.delete({
            ...filter,
        });
    }
}