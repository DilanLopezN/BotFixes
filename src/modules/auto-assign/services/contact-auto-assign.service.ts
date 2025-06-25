import { Injectable } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { AUTO_ASSIGN_CONNECTION } from '../ormconfig';
import { PaginatedModel } from '../../../common/interfaces/paginated';
import { ContactAutoAssign } from '../models/contact-auto-assign.entity';
import { ContactAutoAssignFilterInterface } from '../interfaces/contact-auto-assign-filter.interface';
import { CreateContactAutoAssign, UpdateContactAutoAssign } from '../interfaces/contact-auto-assign.interface';
import { ExternalDataService } from './external-data.service';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class ContactAutoAssignService {
    constructor(
        @InjectRepository(ContactAutoAssign, AUTO_ASSIGN_CONNECTION)
        public ContactAutoAssignRepository: Repository<ContactAutoAssign>,
        private readonly externalDataService: ExternalDataService,
    ) {}
    @CatchError()
    async getOne(id: number, workspaceId: string) {
        return await this.ContactAutoAssignRepository.findOne({
            id,
            workspaceId,
        });
    }

    @CatchError()
    async getContactAutoAssignByPhone(workspaceId: string, phone: string) {
        const contactAutoAssign = await this.ContactAutoAssignRepository.findOne({
            workspaceId,
            phone,
        });
        return contactAutoAssign;
    }

    @CatchError()
    async getContactAutoAssignListByPhones(workspaceId: string, phones: string[]) {
        let qb = this.ContactAutoAssignRepository.createQueryBuilder('contact_auto_assign')
            .andWhere('contact_auto_assign.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .andWhere('contact_auto_assign.phone IN (:...phones)', {
                phones: phones,
            });

        return await qb.getMany();
    }

    @CatchError()
    async listByWorkspaceIdAndQuery(
        workspaceId: string,
        query?: {
            skip?: number;
            limit?: number;
            filter?: ContactAutoAssignFilterInterface;
        },
    ): Promise<PaginatedModel<ContactAutoAssign>> {
        const skip = query?.skip || 0;
        const limit = query?.limit || 10;
        let qb = this.ContactAutoAssignRepository.createQueryBuilder('contact_auto_assign');
        qb = qb.andWhere('contact_auto_assign.workspace_id = :workspaceId', {
            workspaceId: workspaceId,
        });

        if (query.filter) {
            if (query.filter?.name) {
                qb = qb.andWhere('contact_auto_assign.name = :name', {
                    name: query.filter.name,
                });
            }

            if (query.filter?.phone) {
                qb = qb.andWhere('contact_auto_assign.phone = :phone', {
                    phone: query.filter.phone,
                });
            }
        }

        if (query.skip) {
            qb = qb.skip(skip);
        }
        if (query.limit) {
            qb = qb.take(limit);
        }

        const [data, count] = await qb.getManyAndCount();

        const currentPage = query.skip && query.limit ? skip / limit + 1 : null;

        return {
            count: count,
            data: data,
            currentPage: currentPage,
            nextPage: null,
        };
    }

    // Função chamada no update do AutoAssign, onde executa uma transação para ter certeza da criação/atualização dos contatos
    @CatchError()
    async onUpdateAutoAssignConversation(
        autoAssignConversationId: number,
        workspaceId: string,
        queryRunner: QueryRunner,
        contacts: CreateContactAutoAssign[],
    ) {
        await queryRunner.manager
            .createQueryBuilder(ContactAutoAssign, 'contact_auto_assign')
            .update(ContactAutoAssign)
            .set({
                autoAssignConversationIds: () =>
                    `array_remove(auto_assign_conversation_ids, ${autoAssignConversationId})`,
            })
            .andWhere('contact_auto_assign.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .andWhere(':autoAssignConversationId = ANY(contact_auto_assign.auto_assign_conversation_ids)', {
                autoAssignConversationId: autoAssignConversationId,
            })
            .execute();

        const contactList = await Promise.all(
            contacts.map(async (currContact) => {
                let phone = currContact.phone;
                let contactId = currContact.contactId;

                const contact = await this.externalDataService.getContactByPhone(workspaceId, currContact.phone);

                if (contact) {
                    contactId = castObjectIdToString(contact._id);
                }

                return { ...currContact, phone, contactId };
            }),
        );

        return await Promise.all(
            contactList.map(async (contact) => {
                return await queryRunner.manager.save(ContactAutoAssign, {
                    ...contact,
                    workspaceId: workspaceId,
                });
            }),
        );
    }

    @CatchError()
    async create(data: CreateContactAutoAssign) {
        const existPhone = await this.getContactAutoAssignByPhone(data.workspaceId, data.phone);

        if (existPhone) {
            throw Exceptions.ERROR_PHONE_AUTO_ASSIGN_CONVERSATION;
        }

        let name = data.name;
        let phone = data.phone;
        let contactId = data.contactId;

        const contact = await this.externalDataService.getContactByPhone(data.workspaceId, data.phone);

        if (contact) {
            contactId = castObjectIdToString(contact._id);
        }

        return await this.ContactAutoAssignRepository.save({
            name: name,
            workspaceId: data.workspaceId,
            phone: phone,
            contactId: contactId,
            autoAssignConversationIds: data.autoAssignConversationIds,
        });
    }

    @CatchError()
    async update(id: number, data: UpdateContactAutoAssign) {
        let updateContact: any = {
            name: data.name,
            contactId: data.contactId,
        };
        if (data.autoAssignConversationIds) {
            updateContact.autoAssignConversationIds = data.autoAssignConversationIds;
        }
        return await this.ContactAutoAssignRepository.update(
            {
                id: id,
            },
            updateContact,
        );
    }

    // Função remove do campo AutoAssignIds o id passado caso este campo possua apenas um id então da um softDelete neste contato
    @CatchError()
    async softDeleteContactAutoAssignByAutoAssignId(workspaceId: string, autoAssignConversationId: number) {
        const contactAutoAssignList = await this.ContactAutoAssignRepository.createQueryBuilder('contact_auto_assign')
            .andWhere('contact_auto_assign.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .andWhere(':autoAssignConversationId = ANY(contact_auto_assign.auto_assign_conversation_ids)', {
                autoAssignConversationId: autoAssignConversationId,
            })
            .getMany();

        return await Promise.all(
            contactAutoAssignList.map(async (contact) => {
                if (contact.autoAssignConversationIds.length > 1) {
                    const newAutoAssignConversationIds = contact.autoAssignConversationIds.filter(
                        (id) => id === autoAssignConversationId,
                    );
                    return await this.ContactAutoAssignRepository.update(
                        { id: contact.id },
                        {
                            autoAssignConversationIds: newAutoAssignConversationIds,
                        },
                    );
                }

                return await this.ContactAutoAssignRepository.softDelete({
                    id: contact.id,
                });
            }),
        );
    }

    @CatchError()
    async getContactByWorkspaceIdAndContactId(workspaceId: string, contactId: string) {
        return await this.ContactAutoAssignRepository.findOne({
            workspaceId,
            contactId,
        });
    }

    @CatchError()
    async addAutoAssignIdByContactAutoAssign(workspaceId: string, phone: string, autoAssignId: number) {
        const contact = await this.externalDataService.getContactByPhone(workspaceId, phone);

        if (!contact) {
            throw Exceptions.CONTACT_NOT_FOUND;
        }

        const existContactAutoAssign = await this.getContactByWorkspaceIdAndContactId(
            workspaceId,
            castObjectIdToString(contact._id),
        );

        if (!existContactAutoAssign) {
            return await this.ContactAutoAssignRepository.save({
                name: contact.name,
                phone: contact.phone,
                workspaceId: workspaceId,
                contactId: castObjectIdToString(contact._id),
                autoAssignConversationIds: [autoAssignId],
            });
        }

        if (
            existContactAutoAssign?.autoAssignConversationIds.length &&
            existContactAutoAssign?.autoAssignConversationIds.includes(autoAssignId)
        ) {
            throw Exceptions.ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION;
        }

        let newAutoAssignConversationIds = existContactAutoAssign?.autoAssignConversationIds;
        newAutoAssignConversationIds.push(autoAssignId);

        return await this.ContactAutoAssignRepository.update(
            {
                id: existContactAutoAssign.id,
            },
            {
                contactId: castObjectIdToString(contact._id),
                autoAssignConversationIds: newAutoAssignConversationIds,
            },
        );
    }
}
