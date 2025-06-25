import { ContactModel } from './../schema/contact.schema';
import { ConversationService } from './../../conversation/services/conversation.service';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { ChannelIdConfig } from './../../channel-config/interfaces/channel-config.interface';
import { IContact, IContactCreate, IContactUpdate } from './../interface/contact.interface';
import { KissbotEventType, KissbotEventDataType, KissbotEventSource, convertPhoneNumber } from 'kissbot-core';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Inject, forwardRef, Logger, BadRequestException } from '@nestjs/common';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Contact } from '../interface/contact.interface';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Identity, IdentityType } from '../../../modules/conversation/interfaces/conversation.interface';
import { EventsService } from './../../events/events.service';
import { CacheService } from '../../../modules/_core/cache/cache.service';
import { ChannelConfigService } from '../../channel-config/channel-config.service';
import * as moment from 'moment';
import { BlockedContactService } from './blocked-contact.service';
import { castObjectIdToString } from '../../../common/utils/utils';
import { isAnySystemAdmin } from '../../../common/utils/roles';
import { User } from '../../../modules/users/interfaces/user.interface';
import { ContactService as ContactServiceV2 } from '../../contact-v2/services/contact.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { ObjectID } from 'typeorm';

@Injectable()
export class ContactService extends MongooseAbstractionService<Contact> {
    private readonly logger = new Logger(ContactService.name);

    private channelsIdToIgnoreContact = [ChannelIdConfig.webchat, ChannelIdConfig.webemulator] as ChannelIdConfig[];

    constructor(
        @InjectModel('Contact') protected readonly model: Model<Contact>,
        readonly eventsService: EventsService,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        readonly cacheService: CacheService,
        private channelConfigService: ChannelConfigService,
        private blockedContactService: BlockedContactService,
        @Inject(forwardRef(() => ContactServiceV2))
        private contactServiceV2: ContactServiceV2,
        private workspaceService: WorkspacesService,
    ) {
        super(model, cacheService, eventsService);
    }

    getSearchFilter() {}

    getEventsData() {}

    private parseModel(model: Contact): IContact {
        return {
            id: model._id.toString(),
            _id: model._id.toString(),
            phone: model.phone,
            ddi: model.ddi,
            whatsapp: model.whatsapp,
            telegram: model.telegram,
            email: model.email,
            name: model.name,
            conversations: model.conversations,
            webchatId: model.webchatId,
            createdByChannel: model.createdByChannel,
            workspaceId: model.workspaceId,
            blockedBy: model.blockedBy,
            blockedAt: model.blockedAt,
        };
    }

    private async isPostgresEnabled(workspaceId: string): Promise<boolean> {
        const workspace = await this.workspaceService.getModel().findOne({ _id: workspaceId });

        return workspace.featureFlag.enableContactV2;
    }

    public dispatch(event: { type: KissbotEventType; data: any }) {
        switch (event.type) {
            case KissbotEventType.CONVERSATION_CREATED:
                return this.createContactsFromConversationMember(event.data);
        }
    }

    public async getContact(workspaceId: string, contactId: string): Promise<IContact> {
        if (await this.isPostgresEnabled(workspaceId)) {
            return await this.contactServiceV2.getOne(contactId);
        }

        return this.parseModel(await this.getOne(contactId));
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
        if (await this.isPostgresEnabled(workspaceId)) {
            return this.contactServiceV2.getContactByWhatsapp(phone, workspaceId);
        }

        if (!phone?.length) {
            return undefined;
        }

        const parsedNumber = convertPhoneNumber(phone);
        const parsedNumber2 = parsedNumber
            .split('')
            .filter((_, index) => index !== 4)
            .join('');

        const phonesToValidate: string[] = [parsedNumber, parsedNumber2, phone];

        const query: FilterQuery<Contact> = {
            workspaceId,
            $or: [...new Set(phonesToValidate)].map((phone) => ({ whatsapp: phone })),
        };

        return await this.model.findOne(query);
    }

    public async getContactByWhatsappList(phones: string[], workspaceId: string): Promise<Partial<IContact>[]> {
        if (await this.isPostgresEnabled(workspaceId)) {
            return await this.contactServiceV2.getContactByWhatsappList(phones, workspaceId);
        }

        if (!phones?.length) {
            return undefined;
        }

        let phonesToValidate: string[] = [];
        for (const currPhone of phones) {
            if (!currPhone?.length) {
                continue;
            }
            const parsedNumber = convertPhoneNumber(currPhone);
            const parsedNumber2 = parsedNumber
                .split('')
                .filter((_, index) => index !== 4)
                .join('');

            phonesToValidate.push(parsedNumber);
            phonesToValidate.push(parsedNumber2);
            phonesToValidate.push(currPhone);
        }

        const query: FilterQuery<Contact> = {
            workspaceId,
            whatsapp: {
                $in: [...new Set(phonesToValidate)],
            },
        };

        return await this.model.find(query);
    }

    private async getContactByTelegram(telegram: string, workspaceId: string): Promise<IContact> {
        return await this.model.findOne({
            telegram,
            workspaceId,
        });
    }

    async updateContactWhatsapp(possiblesWhatsapp: string[], whatsapp: string, workspaceId: string) {
        await this.contactServiceV2.updateContactWhatsapp(possiblesWhatsapp, whatsapp, workspaceId);

        return await this.model.updateOne(
            {
                workspaceId,
                whatsapp: {
                    $in: possiblesWhatsapp,
                },
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

        // se tiver membro sem contactId mas o número já existir ignora a criação e apenas vincula
        // a nova conversa ao contato existente
        if (phoneChannels.includes(member.channelId as ChannelIdConfig) && contact.whatsapp) {
            const existingContact = await this.getContactByWhatsapp(contact.whatsapp, workspaceId);

            if (existingContact) {
                return await this.vinculeConversationIdToExistingContact(
                    castObjectIdToString(existingContact._id),
                    conversationId,
                    member.id,
                    workspaceId,
                );
            }
        } else if (member.channelId === ChannelIdConfig.telegram) {
            const existingContact = await this.getContactByTelegram(contact.telegram, workspaceId);

            if (existingContact) {
                return await this.vinculeConversationIdToExistingContact(
                    castObjectIdToString(existingContact._id),
                    conversationId,
                    member.id,
                    workspaceId,
                );
            }
        }

        const contactModel = new ContactModel({
            ...contact,
            conversations: [conversationId],
            name: contact.name ?? contact.phone,
        });

        const createdContact = await this.create(contactModel);
        await this.vinculeContactToConversationMember(conversationId, member.id, createdContact);

        (contact as any).id = createdContact._id.toString();
        const result = await this.contactServiceV2.createContact(contact, member, workspaceId, conversationId);

        if (await this.isPostgresEnabled(workspaceId)) return result;

        await this.eventsService.sendEvent({
            data: createdContact,
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_CREATED,
        });

        return createdContact;
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
        await this.updateRaw(
            {
                _id: contactId,
                conversations: { $nin: [conversationId] },
            },
            {
                $addToSet: {
                    conversations: conversationId,
                },
            },
        );

        const result = await this.contactServiceV2.vinculeConversationIdToExistingContact(
            contactId,
            conversationId,
            memberId,
        );

        if (await this.isPostgresEnabled(workspaceId)) return result;

        const updatedContact = await this.getOne(contactId);
        await this.vinculeContactToConversationMember(conversationId, memberId, updatedContact);
    }

    private async updateContact(contactId: string, conversationId: string, memberId: string, workspaceId: string) {
        return await this.vinculeConversationIdToExistingContact(contactId, conversationId, memberId, workspaceId);
    }

    /**
     *  Atualiza membro da conversa atual com dados do contato criado / atualizado
     * @param conversationId
     * @param memberId
     * @param contact
     * @returns
     */
    private async vinculeContactToConversationMember(conversationId: string, memberId: string, contact: Contact) {
        return await this.conversationService.updateMemberWithContact(conversationId, {
            id: memberId,
            contactId: castObjectIdToString(contact._id),
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

        await this.updateRaw(
            {
                _id: contactId,
            },
            {
                $set: {
                    ...partialContact,
                },
            },
        );

        const result = await this.contactServiceV2._update(contactId, partialContact, workspaceId, authUser);

        if (await this.isPostgresEnabled(workspaceId)) return result;

        const contactUpdated = await this.model.findById(contactId);

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

        return this.parseModel(contactUpdated);
    }

    @CatchError()
    public async _create(contact: IContactCreate, workspaceId: string) {
        const query: FilterQuery<Contact> = {
            $and: [{ $or: [{ phone: String(contact.phone) }] }, { workspaceId }],
        };

        if (contact.email) {
            query.$and[0].$or.push({ email: contact.email });
        }

        const existingContact = await this.model.findOne(query);

        if (existingContact) {
            return { exist: existingContact };
        }

        const contactModel = new ContactModel({
            ...contact,
            workspaceId,
        });

        const createdContact = await this.create(contactModel);

        (contact as any).id = createdContact._id.toString();
        const result = await this.contactServiceV2._create(contact, workspaceId);

        if (await this.isPostgresEnabled(workspaceId)) return result;

        await this.eventsService.sendEvent({
            data: createdContact,
            dataType: KissbotEventDataType.CONTACT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONTACT_CREATED,
        });

        return createdContact;
    }

    public async importContacts(
        contacts: { name: string; phone: string }[],
        workspaceId: string,
        createdByChannel: ChannelIdConfig,
    ) {
        const existContacts = await this.getAll({
            workspaceId,
            whatsapp: { $in: [...contacts.map((currContact) => currContact.phone)] },
        });

        const newArr = [];
        const contactsToPostgres = [];

        contacts.map((contact) => {
            const exist = existContacts.find((currContact) => currContact.whatsapp === contact.phone);

            if (!exist) {
                const id = new ObjectID();
                const contactModel = new ContactModel({
                    _id: id,
                    whatsapp: contact.phone,
                    name: contact.name,
                    createdByChannel,
                    phone: contact.phone,
                    workspaceId,
                });

                contactsToPostgres.push({ id: id.toString(), ...contact });
                newArr.push(this.create(contactModel));
            } else if (exist.name === 'Visitante') {
                return;
            } else {
                const contactModel = new ContactModel({
                    ...exist.toJSON({ minimize: false }),
                    name: contact.name,
                });

                newArr.push(
                    this.updateRaw(
                        {
                            _id: exist._id,
                        },
                        contactModel,
                    ),
                );
            }
        });

        await this.contactServiceV2.importContacts(contactsToPostgres, workspaceId, ChannelIdConfig.liveagent);

        return await Promise.all(newArr);
    }

    @CatchError()
    async block(workspaceId: string, contactId: string, userId: string) {
        await this.contactServiceV2.block(workspaceId, contactId, userId);

        const contact = await this.model.findOne({
            workspaceId,
            _id: contactId,
        });

        if (!contact) throw Exceptions.CANNOT_BLOCK_NOT_FOUND_CONTACT;

        const isBlocked = !!contact.blockedAt;
        let update: UpdateQuery<Contact> = {
            $set: {
                [`blockedAt`]: moment().valueOf(),
                ['blockedBy']: userId,
            },
        };

        if (isBlocked) {
            update = {
                $unset: {
                    [`blockedAt`]: 1,
                    ['blockedBy']: 1,
                },
            };
            const blockedContact = await this.blockedContactService.getBlockedContactByContactId(
                castObjectIdToString(contact._id),
                workspaceId,
            );

            if (blockedContact) {
                const result = await this.blockedContactService.delete(
                    workspaceId,
                    castObjectIdToString(blockedContact._id),
                );

                if (!result?.ok) {
                    throw Exceptions.CANNOT_BLOCK_NOT_FOUND_CONTACT;
                }
            }
        } else {
            const createdBlockedContact = await this.blockedContactService.createBlockedContact(workspaceId, {
                contactId: castObjectIdToString(contact._id),
                blockedBy: userId,
                whatsapp: contact.whatsapp,
                phone: contact.phone,
            });

            if (!createdBlockedContact) throw Exceptions.CANNOT_CREATE_BLOCK_CONTACT;
        }

        await this.model.updateOne(
            {
                _id: contactId,
            },
            update,
        );

        await this.cacheService.remove(contactId);
    }
}
