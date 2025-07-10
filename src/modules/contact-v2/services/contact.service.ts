import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindConditions } from 'typeorm';
import { CONTACT_CONNECTION } from '../ormconfig';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { ContactEntity } from '../entities/contact.entity';
import { EventsService } from '../../events/events.service';
import { CacheService } from '../../_core/cache/cache.service';
import { ChannelIdConfig } from '../../channel-config/interfaces/channel-config.interface';
import { ConversationService } from '../../conversation/services/conversation.service';
import {
    KissbotEventType,
    KissbotEventDataType,
    KissbotEventSource,
    convertPhoneNumber,
    IdentityType,
} from 'kissbot-core';
import { Identity } from '../interfaces/identity.interface';
import { IContact, IContactCreate, IContactUpdate } from '../interfaces/contact.interface';
import { BlockedContactService } from './blocked-contact.service';
import { isAnySystemAdmin } from '../../../common/utils/roles';
import { User } from '../../../modules/users/interfaces/user.interface';
import * as moment from 'moment';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class ContactService {
    private channelsIdToIgnoreContact = [ChannelIdConfig.webchat, ChannelIdConfig.webemulator] as ChannelIdConfig[];

    constructor(
        @InjectRepository(ContactEntity, CONTACT_CONNECTION)
        private readonly repository: Repository<ContactEntity>,
        private readonly eventsService: EventsService,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        private readonly cacheService: CacheService,
        private readonly blockedContactService: BlockedContactService,
    ) {}

    getSearchFilter() {}

    getEventsData() {}

    public dispatch(event: { type: KissbotEventType; data: any }) {
        switch (event.type) {
            case KissbotEventType.CONVERSATION_CREATED:
                return this.createContactsFromConversationMember(event.data);
        }
    }

    /**
     * Recebe membro de uma conversa e transforma em um modelo parcial do modelo de contato
     * @param member
     * @param channelId
     * @returns
     */
    private replaceMemberToContactModel(
        member: Identity,
        channelId: string,
    ): Partial<IContactCreate> & { name: string } {
        switch (channelId) {
            case ChannelIdConfig.whatsweb:
            case ChannelIdConfig.wabox:
            case ChannelIdConfig.whatsapp:
            case ChannelIdConfig.gupshup:
                return {
                    phone: member.phone,
                    name: member.name,
                    whatsapp: member.id,
                    ddi: member.ddi || '55',
                };
            case ChannelIdConfig.telegram:
                return {
                    phone: member.phone,
                    name: member.name,
                    telegram: member.id,
                };
            case ChannelIdConfig.facebook:
                return {
                    name: member.name,
                } as IContactCreate;
            case ChannelIdConfig.webemulator:
            case ChannelIdConfig.emulator:
                return {
                    name: member.name,
                };

            case ChannelIdConfig.webchat:
                return {
                    name: member.name,
                };

            default:
                return;
        }
    }

    /**
     * Recebe conversa da fila e utiliza os membros da conversa para gerar um contato caso
     * não exista ainda. Caso exista, adiciona o conversationId dentro das conversas do contato
     * @param data
     * @returns
     */
    private async createContactsFromConversationMember(data: any) {
        const {
            members,
            workspace,
            createdByChannel,
            _id: conversationId,
        } = data as { members: Identity[]; [key: string]: any };

        const contactMembers = members.filter(
            (member) =>
                member.type === IdentityType.user &&
                !this.channelsIdToIgnoreContact.includes(member.channelId as ChannelIdConfig),
        );

        for (const member of contactMembers) {
            const contact: IContactCreate = {
                ...this.replaceMemberToContactModel(member, member.channelId),
                workspaceId: workspace._id,
                createdByChannel,
            };

            if (!member.contactId) {
                return await this.createContact(contact, member, workspace._id, conversationId);
            }

            await this.updateContact(member.contactId, conversationId, member.id, workspace._id);
        }
    }

    public async getContactByWhatsapp(phone: string, workspaceId: string): Promise<IContact> {
        if (!phone?.length) return undefined;

        const parsedNumber = convertPhoneNumber(phone);
        const parsedNumber2 = parsedNumber
            .split('')
            .filter((_, index) => index !== 4)
            .join('');

        const phonesToValidate: string[] = [...new Set([parsedNumber, parsedNumber2, phone])];

        return await this.repository.findOne({
            where: {
                workspaceId: castObjectIdToString(workspaceId),
                whatsapp: In(phonesToValidate),
            },
        });
    }

    public async getContactByWhatsappList(phones: string[], workspaceId: string): Promise<Partial<IContact>[]> {
        if (!phones?.length) return undefined;

        let phonesToValidate: string[] = [];
        for (const currPhone of phones) {
            if (!currPhone?.length) continue;

            const parsedNumber = convertPhoneNumber(currPhone);
            const parsedNumber2 = parsedNumber
                .split('')
                .filter((_, index) => index !== 4)
                .join('');

            phonesToValidate.push(parsedNumber);
            phonesToValidate.push(parsedNumber2);
            phonesToValidate.push(currPhone);
        }

        return await this.repository.find({
            where: {
                workspaceId: castObjectIdToString(workspaceId),
                whatsapp: In([...new Set(phonesToValidate)]),
            },
        });
    }

    private async getContactByTelegram(telegram: string, workspaceId: string): Promise<IContact> {
        return await this.repository.findOne({ where: { telegram, workspaceId } });
    }

    async updateContactWhatsapp(possiblesWhatsapp: string[], whatsapp: string, workspaceId: string) {
        return await this.repository.update(
            {
                workspaceId: castObjectIdToString(workspaceId),
                whatsapp: In(possiblesWhatsapp),
            },
            {
                whatsapp,
            },
        );
    }

    public async createContact(contact: IContactCreate, member: Identity, workspaceId: string, conversationId: string) {
        const phoneChannels = [
            ChannelIdConfig.whatsweb,
            ChannelIdConfig.wabox,
            ChannelIdConfig.whatsapp,
            ChannelIdConfig.gupshup,
        ];

        if (phoneChannels.includes(member.channelId as ChannelIdConfig) && contact.phone) {
            const existingContact = await this.getContactByWhatsapp(contact.phone, workspaceId);

            if (existingContact) {
                return await this.vinculeConversationIdToExistingContact(
                    existingContact.id,
                    conversationId,
                    member.id,
                    workspaceId,
                );
            }
        } else if (member.channelId === ChannelIdConfig.telegram) {
            const existingContact = await this.getContactByTelegram(contact.telegram, workspaceId);

            if (existingContact) {
                return await this.vinculeConversationIdToExistingContact(
                    existingContact.id,
                    conversationId,
                    member.id,
                    workspaceId,
                );
            }
        }

        const newContact = this.repository.create({
            ...contact,
            conversations: [castObjectIdToString(conversationId)],
            name: contact.name ?? contact.phone,
        });

        const createdContact = await this.repository.save(newContact);
        await this.vinculeContactToConversationMember(conversationId, member.id, createdContact);

        await this.eventsService.sendEvent({
            data: createdContact,
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_CREATED,
        });

        return createdContact;
    }

    // TODO: Remove this public method when migration to contact v2 is finished
    public async vinculeConversationToContact(
        contactId: string,
        conversationId: string,
        workspaceId: string,
        mongoContact: IContact,
    ) {
        let contact: any = await this.repository.findOne({
            where: {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
        });

        if (!contact) {
            contact = await this._create({ ...mongoContact, id: castObjectIdToString(mongoContact._id) }, workspaceId);
        }

        if (
            contact &&
            (!contact.conversations || !contact.conversations.includes(castObjectIdToString(conversationId)))
        ) {
            if (!contact.conversations) contact.conversations = [];

            contact.conversations.push(castObjectIdToString(conversationId));

            await this.repository.update(
                {
                    id: castObjectIdToString(contactId),
                    workspaceId: castObjectIdToString(workspaceId),
                },
                {
                    conversations: contact.conversations,
                },
            );
        }

        return await this.getOne(contactId, workspaceId);
    }

    /**
     * Vincula conversa ao contato adicionando no array de conversas do contato
     * @param contactId
     * @param conversationId
     * @param memberId
     */
    private async vinculeConversationIdToExistingContact(
        contactId: string,
        conversationId: string,
        memberId: string,
        workspaceId: string,
    ) {
        const contact = await this.repository.findOne({
            where: {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
        });

        if (
            contact &&
            (!contact.conversations || !contact.conversations.includes(castObjectIdToString(conversationId)))
        ) {
            if (!contact.conversations) contact.conversations = [];

            contact.conversations.push(castObjectIdToString(conversationId));

            await this.repository.update(
                {
                    id: castObjectIdToString(contactId),
                    workspaceId: castObjectIdToString(workspaceId),
                },
                {
                    conversations: contact.conversations,
                },
            );
        }

        const updatedContact = await this.getOne(contactId, workspaceId);

        await this.vinculeContactToConversationMember(conversationId, memberId, updatedContact);

        return updatedContact;
    }

    public async getOne(contactId: string, workspaceId: string): Promise<IContact> {
        contactId = castObjectIdToString(contactId);
        workspaceId = castObjectIdToString(workspaceId);

        const cachedContact = await this.cacheService.get(contactId);

        if (cachedContact) return cachedContact;

        const contact = await this.repository.findOne({
            where: {
                id: contactId,
                workspaceId: workspaceId,
            },
        });

        if (contact) await this.cacheService.set(contact, contactId);

        return contact;
    }

    private async updateContact(contactId: string, conversationId: string, memberId: string, workspaceId: string) {
        return await this.vinculeConversationIdToExistingContact(contactId, conversationId, memberId, workspaceId);
    }

    /**
     * Atualiza membro da conversa atual com dados do contato criado / atualizado
     * @param conversationId
     * @param memberId
     * @param contact
     * @returns
     */
    private async vinculeContactToConversationMember(conversationId: string, memberId: string, contact: IContact) {
        return await this.conversationService.updateMemberWithContact(conversationId, {
            id: memberId,
            contactId: contact.id,
            name: contact.name,
        });
    }

    @CatchError()
    public async _update(
        contactId: string,
        partialContact: Partial<IContactUpdate>,
        workspaceId: string,
        authUser: User,
    ): Promise<IContact> {
        const isAnyAdmin = isAnySystemAdmin(authUser);

        if (!isAnyAdmin) {
            delete partialContact.ddi;
            delete partialContact.phone;
        }

        if (partialContact?.phone && !/^\d+$/.test(partialContact.phone)) {
            throw new BadRequestException('The phone field should only contain numbers');
        }

        if (partialContact?.ddi && !/^\d+$/.test(partialContact.ddi)) {
            throw new BadRequestException('The ddi field should only contain numbers');
        }

        if (isAnyAdmin && partialContact?.ddi !== '' && partialContact?.phone !== '') {
            partialContact.whatsapp = partialContact.ddi + partialContact?.phone;
        }

        await this.repository.update(
            {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
            partialContact,
        );

        const contactUpdated = await this.repository.findOne({
            where: {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
        });

        const conversationsWithMembersRefContactId = await this.conversationService.getModel().find({
            'workspace._id': workspaceId,
            'members.contactId': contactId,
        });

        if (conversationsWithMembersRefContactId?.length) {
            await this.conversationService.updateMembersWithContactModel(
                conversationsWithMembersRefContactId,
                contactUpdated,
                contactId,
            );
        }

        await this.eventsService.sendEvent({
            data: contactUpdated,
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_UPDATED,
        });

        await this.cacheService.remove(castObjectIdToString(contactId));

        return contactUpdated;
    }

    @CatchError()
    public async _create(contact: IContactCreate, workspaceId: string) {
        workspaceId = castObjectIdToString(workspaceId);

        const query: FindConditions<ContactEntity> = { workspaceId };

        const orConditions = [];
        if (contact.phone) orConditions.push({ phone: String(contact.phone) });
        if (contact.email) orConditions.push({ email: contact.email });

        let existingContact: IContact = null;
        if (orConditions.length > 0) {
            existingContact = await this.repository.findOne({
                where: [...orConditions.map((cond) => ({ ...cond, ...query }))],
            });
        }

        if (existingContact) return { exist: existingContact };

        const newContact = this.repository.create({ ...contact, workspaceId });

        const createdContact = await this.repository.save(newContact);

        await this.eventsService.sendEvent({
            data: createdContact,
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_CREATED,
        });

        return createdContact;
    }

    public async importContacts(
        contacts: { id?: string; name: string; phone: string }[],
        workspaceId: string,
        createdByChannel: ChannelIdConfig,
    ) {
        workspaceId = castObjectIdToString(workspaceId);

        const existingContacts = await this.repository.find({
            where: {
                workspaceId,
                whatsapp: In([...contacts.map((contact) => contact.phone)]),
            },
        });

        const operations = [];

        contacts.forEach((contact) => {
            const exist = existingContacts.find((existingContact) => existingContact.whatsapp === contact.phone);

            if (!exist) {
                const newContact = this.repository.create({
                    whatsapp: contact.phone,
                    name: contact.name,
                    createdByChannel,
                    phone: contact.phone,
                    workspaceId,
                });

                if (contact.id) newContact.id = castObjectIdToString(contact.id);

                operations.push(this.repository.save(newContact));
            } else if (exist.name === 'Visitante') {
                return;
            } else {
                exist.name = contact.name;
                operations.push(this.repository.save(exist));
            }
        });

        return await Promise.all(operations);
    }

    @CatchError()
    async block(workspaceId: string, contactId: string, userId: string) {
        const contact = await this.repository.findOne({
            where: {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
        });

        if (!contact) throw Exceptions.CANNOT_BLOCK_NOT_FOUND_CONTACT;

        const isBlocked = !!contact.blockedAt;

        if (isBlocked) {
            contact.blockedAt = null;
            contact.blockedBy = null;

            const blockedContact = await this.blockedContactService.getBlockedContactByContactId(
                contactId,
                workspaceId,
            );

            if (blockedContact) {
                const result = await this.blockedContactService.delete(workspaceId, blockedContact.id);

                if (!result?.ok) throw Exceptions.CANNOT_BLOCK_NOT_FOUND_CONTACT;
            }
        } else {
            contact.blockedAt = moment().valueOf();
            contact.blockedBy = castObjectIdToString(userId);

            const createdBlockedContact = await this.blockedContactService.createBlockedContact(workspaceId, {
                contactId: contact.id,
                blockedBy: castObjectIdToString(userId),
                whatsapp: contact.whatsapp,
                phone: contact.phone,
            });

            if (!createdBlockedContact) throw Exceptions.CANNOT_CREATE_BLOCK_CONTACT;
        }

        await this.repository.update(
            {
                id: castObjectIdToString(contactId),
                workspaceId: castObjectIdToString(workspaceId),
            },
            {
                blockedAt: contact.blockedAt,
                blockedBy: contact.blockedBy,
            },
        );

        await this.cacheService.remove(castObjectIdToString(contactId));

        await this.eventsService.sendEvent({
            data: {
                contactId: contact.id,
                workspaceId: castObjectIdToString(workspaceId),
                isBlocked: !isBlocked, // isBlocked representa o estado anterior
            },
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_BLOCKED,
        });
    }
}
