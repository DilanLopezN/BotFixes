import { InjectRepository } from '@nestjs/typeorm';
import { Campaign, CampaignStatus } from '../../campaign/models/campaign.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { EntityManager, Repository } from 'typeorm';
import * as moment from 'moment';
import { DEFAULT_CONTACT_LIST_LIMITS } from '../../campaign/models/campaign.entity';
import {
    CreateContactResponse,
    CreateCampaignParams,
    CreateCampaignResponse,
} from '../interfaces/create-campaign.interface';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { ExternalDataService } from './external-data.service';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { CampaignContact } from '../../campaign/models/campaign-contact.entity';
import { CampaignAttribute } from '../../campaign/models/campaign-attributes.entity';
import { UpdateCampaignParams, UpdateCampaignResponse } from '../interfaces/update-campaign.interface';
import { DoDeleteCampaignResponse } from '../interfaces/do-delete-campaign.interface';
import { ContactService } from './contact.service';
import { CampaignContactService } from './campaign-contact.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { CampaignResume } from '../../campaign/interfaces/campaign-resume.interface';
import { ListCampaignParams } from '../interfaces/list-campaign.interface';
import { CacheService } from '../../_core/cache/cache.service';
import { ContactAttribute } from '../../campaign/models/contact-attribute.entity';
import { SendActiveMessageData } from '../../active-message/interfaces/send-active-message-data.interface';
import { CloneCampaignParams } from '../interfaces/clone-campaign.interface';
import { CampaignAttributeService } from './campaign-attribute.service';
import { Contact } from '../../campaign/models/contact.entity';
import { GetCampaignResponse, GetContactResponse } from '../interfaces/get-campaign.interface';
import { campaignTopicName } from '../../campaign/services/campaign.service';
import { KafkaService } from '../../_core/kafka/kafka.service';
import * as Sentry from '@sentry/node';

export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);
    constructor(
        @InjectRepository(Campaign, CAMPAIGN_CONNECTION)
        private campaignRepository: Repository<Campaign>,
        private readonly externalDataService: ExternalDataService,
        private readonly contactService: ContactService,
        @Inject(forwardRef(() => CampaignAttributeService))
        private readonly campaignAttributeService: CampaignAttributeService,
        @Inject(forwardRef(() => CampaignContactService))
        private readonly campaignContactService: CampaignContactService,
        public cacheService: CacheService,
        private kafkaService: KafkaService,
    ) {}

    @CatchError()
    async getPauseCacheKey(campaignId: number) {
        return `CAMPAIGN_PAUSED_${campaignId}`;
    }

    async contactToContactResponse(contacts: Contact[]): Promise<CreateContactResponse[] | GetContactResponse[]> {
        return contacts.map((contact) => {
            const contactParams: CreateContactResponse | GetContactResponse = {
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                sent:
                    contact.campaignContact?.invalid ||
                    !contact.campaignContact?.sendAt ||
                    !contact.campaignContact?.receivedAt
                        ? false
                        : true,
                conversationId: contact?.conversationId,
                descriptionError: contact?.descriptionError,
            };

            if (contact.contactAttributes) {
                contact.contactAttributes.forEach((attr) => {
                    contactParams[attr.name] = attr.value;
                });
            }

            return contactParams;
        });
    }

    getStatus(data: CreateCampaignParams) {
        if (!data.contacts || data.contacts.length === 0) {
            return CampaignStatus.draft;
        }
        return data.sendAt || data.immediateStart ? CampaignStatus.awaiting_send : CampaignStatus.draft;
    }

    @CatchError()
    async createCampaign(
        workspaceId: string,
        data: CreateCampaignParams,
    ): Promise<DefaultResponse<CreateCampaignResponse>> {
        if (data.sendAt && moment(data.sendAt).isBefore(moment())) {
            throw Exceptions.CAMPAIGN_SEND_AT_MUST_BE_FUTURE;
        }

        if (data.sendAt && data.immediateStart) {
            throw Exceptions.CAMPAIGN_IMMEDIATE_START_AND_SEND_AT_SUPPLIED;
        }

        const activeMessageSetting = await this.externalDataService.getOneActiveMessageSetting(
            data.activeMessageSettingId,
        );
        if (!activeMessageSetting || activeMessageSetting.workspaceId !== workspaceId) {
            throw Exceptions.ACTIVE_MESSAGE_SETTINGS_NOT_FOUND;
        }
        if (!activeMessageSetting.enabled) {
            throw Exceptions.ACTIVE_MESSAGE_SETTINGS_NOT_ENABLED;
        }
        if (data.action) {
            const interactionIsPublished = await this.externalDataService.checkInteractionIsPublishedByTrigger(
                workspaceId,
                data.action,
            );
            if (!interactionIsPublished) throw Exceptions.INTERACTION_IS_NOT_PUBLISHED;
        }

        const defaultContactLimit = data.isTest
            ? DEFAULT_CONTACT_LIST_LIMITS.TEST_LIST_LIMIT
            : DEFAULT_CONTACT_LIST_LIMITS.NORMAL_LIST_LIMIT;

        const contactLimit = activeMessageSetting.data?.contactListLimit || defaultContactLimit;

        if (data.contacts.length > contactLimit) {
            throw Exceptions.CAMPAIGN_CONTACTS_LIMIT_EXCEEDED;
        }

        const templateMessage = await this.externalDataService.getOneTemplateMessage(data.templateId);
        if (!templateMessage) {
            throw Exceptions.TEMPLATE_MESSAGE_NOT_FOUND;
        }

        const savedCampaign = await this.campaignRepository.manager.transaction(
            async (transactionalEntityManager: EntityManager) => {
                const campaign = this.campaignRepository.create({
                    ...data,
                    workspaceId,
                    createdAt: moment().valueOf(),
                    status: this.getStatus(data),
                });

                const savedCampaign = await transactionalEntityManager.save(campaign);
                const expectedAttributes = await this.externalDataService.getTemplateVariableKeys(data.templateId);
                savedCampaign.campaignAttributes = [];
                for (const key of expectedAttributes) {
                    const attribute = templateMessage?.variables?.find((variable) => variable.value === key) || {
                        value: key,
                        label: key,
                    };
                    savedCampaign.campaignAttributes.push(
                        await this.campaignAttributeService.createAttribute(
                            {
                                name: attribute.value,
                                label: attribute.label,
                                campaignId: savedCampaign.id,
                            },
                            transactionalEntityManager,
                        ),
                    );
                }

                savedCampaign.contacts = [];
                let hasAllAttributes = false;
                for (const contact of data.contacts) {
                    const contactAttributeNames = Object.keys(contact).filter(
                        (attr) => attr !== 'name' && attr !== 'phone',
                    );

                    hasAllAttributes = expectedAttributes.every(
                        (attr) => contactAttributeNames.includes(attr) && contact[attr] !== '',
                    );

                    if (!hasAllAttributes && data.immediateStart) {
                        throw Exceptions.MISSING_CONTACT_ATTRIBUTES_FOR_IMMEDIATE_START;
                    }
                    const contactAttributes: Partial<ContactAttribute>[] = contactAttributeNames.map((attr) => ({
                        name: attr,
                        value: contact[attr],
                    }));

                    savedCampaign.contacts.push(
                        await this.campaignContactService.createCampaignContact(
                            {
                                name: contact.name,
                                phone: contact.phone,
                                workspaceId,
                                campaignId: savedCampaign.id,
                                contactAttributes,
                            },
                            transactionalEntityManager,
                        ),
                    );
                }

                if (!hasAllAttributes && !data.immediateStart) {
                    savedCampaign.status = CampaignStatus.draft;
                    await transactionalEntityManager.save(savedCampaign);
                }

                return savedCampaign;
            },
        );

        if (data.immediateStart) {
            if (data.contacts.length === 0) throw Exceptions.CAMPAIGN_CANNOT_START_WITH_NO_CONTACTS;
            this.enqueueCampaignKafka(workspaceId, savedCampaign.id);
        }

        const contacts: CreateContactResponse[] = await this.contactToContactResponse(savedCampaign.contacts);

        return {
            data: {
                campaign: savedCampaign,
                contacts,
            },
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    private enqueueCampaignKafka(workspaceId: string, campaignId: number) {
        this.kafkaService.sendEvent({ campaignId }, workspaceId, campaignTopicName);
    }

    @CatchError()
    async startCampaign(campaignId: number) {
        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .leftJoinAndMapMany('cmp.campaignAttributes', CampaignAttribute, 'attr', 'attr.campaign_id = cmp.id')
            .innerJoinAndMapMany('cmp.campaignContact', CampaignContact, 'cmpCtt', 'cmpCtt.campaign_id = cmp.id')
            .where('cmp.id = :campaignId', { campaignId })
            .getOne();

        if (!campaign) {
            this.logger.debug(`Cannot start campaign with no contact or attributes cmpId: ${campaignId}`);
            throw Exceptions.CANNOT_START_INVALID_CAMPAIGN;
        }
        const activeMessageSetting = await this.externalDataService.getOneActiveMessageSetting(
            campaign.activeMessageSettingId,
        );

        if (!campaign.templateId) {
            throw Exceptions.CANNOT_START_INVALID_CAMPAIGN_INVALID_TEMPLATE;
        }

        if (campaign.status !== CampaignStatus.awaiting_send && campaign.status !== CampaignStatus.paused) {
            throw Exceptions.CAMPAIGN_SHOULD_AWAITING_SEND_PAUSED;
        }

        try {
            const contacts = await this.contactService.getCampaignContacts(campaignId);

            await this.campaignRepository.update(
                {
                    id: campaign.id,
                },
                {
                    startedAt: moment().valueOf(),
                    status: CampaignStatus.running,
                },
            );

            const pauseCacheKey = await this.getPauseCacheKey(campaignId);
            const client = this.cacheService.getClient();
            await client.del(pauseCacheKey);

            for (let i = 0; i < contacts.length; i++) {
                const contact = contacts[i];
                const value = await client.get(pauseCacheKey);

                if (value === 'true') {
                    this.logger.log(`Pausing campaign ${campaign.name} - ${campaign.id}`);
                    await client.del(pauseCacheKey);
                    return;
                }

                try {
                    const attr = await this.buildContactAttributes(
                        contact.contactAttributes,
                        campaign.campaignAttributes,
                    );
                    const data: SendActiveMessageData = {
                        apiToken: activeMessageSetting.apiToken,
                        phoneNumber: contact.phone,
                        contactName: contact.name,
                        teamId: undefined,
                        action: campaign.action,
                        attributes: attr,
                        campaignId: campaign.id,
                        templateId: campaign.templateId,
                        externalId: `${contact.campaignContact.hash}`,
                    };

                    if (contact.isValid) {
                        await this.externalDataService.sendMessageFromValidateNumber(
                            {
                                isValid: true,
                                token: activeMessageSetting.channelConfigToken,
                                phone: contact.phone,
                                phoneId: contact.whatsapp,
                                userId: activeMessageSetting.channelConfigToken,
                                whatsapp: contact.whatsapp,
                            },
                            data,
                        );
                    } else {
                        await this.externalDataService.sendMessage(data);
                    }

                    await this.campaignContactService.updateCampaignContactSendAt(contact.campaignContact.id);

                    if (i < contacts.length - 1) {
                        if (campaign.sendInterval) {
                            await new Promise((res, _) => setTimeout(res, campaign.sendInterval));
                        }
                    }
                } catch (error) {
                    console.log('ERROR CampaignServiceV2.startCampaign sendMessage: ', error);
                    Sentry.captureEvent({
                        message: 'ERROR CampaignServiceV2.startCampaign sendMessage',
                        extra: {
                            error: error,
                            contact,
                            campaign,
                        },
                    });
                }
            }
        } catch (error) {
            console.log('ERROR CampaignServiceV2.startCampaign: ', error);
            Sentry.captureEvent({
                message: 'ERROR CampaignServiceV2.startCampaign',
                extra: {
                    error: error,
                    campaign,
                },
            });
        }

        await this.campaignRepository.update(
            {
                id: campaign.id,
            },
            {
                endedAt: moment().valueOf(),
                status: CampaignStatus.finished_complete,
            },
        );
    }

    @CatchError()
    async buildContactAttributes(contactAttributes: ContactAttribute[], campaignAttributes: CampaignAttribute[]) {
        const attributesArr = [];
        campaignAttributes.forEach((cmpAttr) => {
            const contactAttr = contactAttributes.find((attr) => attr.name == cmpAttr.name);
            attributesArr.push({
                value: contactAttr.value,
                name: cmpAttr.name,
                type: '@sys.text',
                label: cmpAttr.label,
            });
        });
        return attributesArr;
    }

    @CatchError()
    async cloneCampaign(workspaceId: string, data: CloneCampaignParams): Promise<DefaultResponse<Partial<Campaign>>> {
        const campaign = await this.campaignRepository.findOne({
            id: data.campaignId,
            workspaceId,
        });

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        const campaignClone: Partial<Campaign> = {
            name: campaign.name,
            workspaceId,
            createdAt: moment().valueOf(),
            activeMessageSettingId: campaign.activeMessageSettingId,
            status: CampaignStatus.draft,
            sendInterval: campaign.sendInterval,
            templateId: campaign.templateId,
            campaignType: campaign.campaignType,
            description: campaign.description,
        };

        if (data.onlyInvalidContacts) {
            campaignClone.isForwarding = true;
        }

        campaignClone.campaignAttributes = await this.campaignAttributeService.getAttributesByCampaign(data.campaignId);

        campaignClone.contacts = await this.contactService.getCampaignContacts(campaign.id, data.onlyInvalidContacts);

        return {
            data: campaignClone,
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    @CatchError()
    async getCampaignByWorkspace(
        workspaceId: string,
        query?: DefaultRequest<ListCampaignParams>,
    ): Promise<DefaultResponse<Campaign[]>> {
        const skip = query?.skip ?? 0;
        const limit = query?.limit ?? 4;
        const data = query.data;

        let q = await this.campaignRepository
            .createQueryBuilder('camp')
            .where('camp.workspace_id = :workspaceId', { workspaceId })
            .skip(skip)
            .take(limit)
            .orderBy('camp.id', 'DESC');

        if (data.isTest !== undefined) {
            if (data.isTest) {
                q = q.andWhere(`camp.is_test IS true`);
            } else {
                q = q.andWhere('camp.is_test IS NOT true');
            }
        }

        if (data.startDate) {
            q = q.andWhere('(camp.send_at >= :startDate OR camp.created_at >= :startDate)', {
                startDate: data.startDate,
            });
        }

        if (data.endDate) {
            q = q.andWhere('(camp.send_at <= :endDate OR camp.created_at <= :endDate)', { endDate: data.endDate });
        }

        if (data.status) {
            q = q.andWhere('camp.status = :status', { status: data.status });
        }

        if (data.name) {
            q = q.andWhere(`unaccent(LOWER(camp.name)) LIKE unaccent(LOWER(:name))`, { name: `%${data.name}%` });
        }

        if (data.hasFail !== undefined) {
            q = q.andWhere((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('1')
                    .from(CampaignContact, 'contact')
                    .where('contact.campaign_id = camp.id')
                    .andWhere('(contact.invalid = true OR contact.send_at IS NULL OR contact.received_at IS NULL)')
                    .getQuery();
                return data.hasFail ? `EXISTS (${subQuery})` : `NOT EXISTS (${subQuery})`;
            });

            if (data.hasFail) {
                q = q.andWhere('camp.status = :status', { status: CampaignStatus.finished_complete });
            }
        }

        const [result, count] = await q.getManyAndCount();

        for (const campaignItem of result) {
            campaignItem.resume = await this.getCampaignResume(campaignItem.id);
        }

        return {
            metadata: {
                count,
                skip,
                limit,
            },
            data: result,
        };
    }

    @CatchError()
    private async getCampaignResume(campaignId: number): Promise<CampaignResume> {
        const contactResume = await this.contactService.getCampaignContactsResume(campaignId);
        const invalidContacts = await this.campaignContactService.getInvalidContactList(campaignId);
        const unsentCount = await this.campaignContactService.getInvalidOrUnsentContactsCount(campaignId);
        return { contactResume, invalidContacts, unsentCount };
    }

    @CatchError()
    async getCampaignById(workspaceId: string, campaignId: number): Promise<DefaultResponse<GetCampaignResponse>> {
        let campaign = await this.campaignRepository.findOne({
            id: campaignId,
            workspaceId,
        });

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        const campaignContacts = await this.contactService.getCampaignContacts(campaignId);

        campaign.resume = await this.getCampaignResume(campaign.id);

        const contacts: GetContactResponse[] = await this.contactToContactResponse(campaignContacts);
        return {
            data: { campaign, contacts },
        };
    }

    async updateCampaign(workspaceId: string, data: UpdateCampaignParams): Promise<UpdateCampaignResponse> {
        if (!data.name) {
            delete data.name;
        }

        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .where('cmp.id = :campaignId', { campaignId: data.id })
            .andWhere('cmp.workspaceId = :workspaceId', { workspaceId })
            .getOne();

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        if (campaign.status !== CampaignStatus.draft && campaign.status !== CampaignStatus.awaiting_send) {
            throw Exceptions.CAMPAIGN_SENDED;
        }

        if (data.sendAt && moment(data.sendAt).isBefore(moment())) {
            throw Exceptions.CAMPAIGN_SEND_AT_MUST_BE_FUTURE;
        }

        if (data.sendAt && data.immediateStart) {
            throw Exceptions.CAMPAIGN_IMMEDIATE_START_AND_SEND_AT_SUPPLIED;
        }

        const activeMessageSetting = await this.externalDataService.getOneActiveMessageSetting(
            data.activeMessageSettingId || campaign.activeMessageSettingId,
        );
        if (!activeMessageSetting || activeMessageSetting.workspaceId !== workspaceId) {
            throw Exceptions.ACTIVE_MESSAGE_SETTINGS_NOT_FOUND;
        }
        if (!activeMessageSetting.enabled) {
            throw Exceptions.ACTIVE_MESSAGE_SETTINGS_NOT_ENABLED;
        }
        if (data.action) {
            const interactionIsPublished = await this.externalDataService.checkInteractionIsPublishedByTrigger(
                workspaceId,
                data.action,
            );
            if (!interactionIsPublished) throw Exceptions.INTERACTION_IS_NOT_PUBLISHED;
        }

        const defaultContactLimit = data.isTest
            ? DEFAULT_CONTACT_LIST_LIMITS.TEST_LIST_LIMIT
            : DEFAULT_CONTACT_LIST_LIMITS.NORMAL_LIST_LIMIT;

        const contactLimit = activeMessageSetting.data?.contactListLimit || defaultContactLimit;

        if (data.contacts.length > contactLimit) {
            throw Exceptions.CAMPAIGN_CONTACTS_LIMIT_EXCEEDED;
        }

        const templateMessage = await this.externalDataService.getOneTemplateMessage(data.templateId);
        if (!templateMessage) {
            throw Exceptions.TEMPLATE_MESSAGE_NOT_FOUND;
        }

        const updatedCampaign = await this.campaignRepository.manager.transaction(
            async (transactionalEntityManager: EntityManager) => {
                await this.campaignContactService.deleteCampaignContacts(campaign.id);
                await this.campaignAttributeService.deleteCampaignAttributes(campaign.id, transactionalEntityManager);

                const updatedCampaign = await transactionalEntityManager.save(Campaign, {
                    ...campaign,
                    ...data,
                    updatedAt: moment().valueOf(),
                    status: this.getStatus(data),
                });

                updatedCampaign.campaignAttributes = [];
                for (const attribute of templateMessage.variables) {
                    updatedCampaign.campaignAttributes.push(
                        await this.campaignAttributeService.createAttribute(
                            {
                                name: attribute.value,
                                label: attribute.label,
                                campaignId: updatedCampaign.id,
                            },
                            transactionalEntityManager,
                        ),
                    );
                }

                const expectedAttributes =
                    templateMessage.message.match(/{{(.*?)}}/g)?.map((string) => string.slice(2, -2)) || [];

                updatedCampaign.contacts = [];
                let hasAllAttributes = false;
                for (const contact of data.contacts) {
                    const contactAttributeNames = Object.keys(contact).filter(
                        (attr) => attr !== 'name' && attr !== 'phone' && attr !== 'id' && attr !== 'conversationId',
                    );

                    const hasAllAttributes = expectedAttributes.every(
                        (attr) => contactAttributeNames.includes(attr) && contact[attr] !== '',
                    );

                    if (!hasAllAttributes && data.immediateStart) {
                        throw Exceptions.MISSING_CONTACT_ATTRIBUTES_FOR_IMMEDIATE_START;
                    }
                    const contactAttributes: Partial<ContactAttribute>[] = contactAttributeNames.map((attr) => ({
                        name: attr,
                        value: contact[attr],
                    }));

                    updatedCampaign.contacts.push(
                        await this.campaignContactService.createCampaignContact(
                            {
                                name: contact.name,
                                phone: contact.phone,
                                workspaceId,
                                campaignId: updatedCampaign.id,
                                contactAttributes,
                            },
                            transactionalEntityManager,
                        ),
                    );
                }

                if (!hasAllAttributes && !data.immediateStart) {
                    updatedCampaign.status = CampaignStatus.draft;
                    await transactionalEntityManager.save(updatedCampaign);
                }

                return updatedCampaign;
            },
        );

        if (data.immediateStart) {
            if (data.contacts.length === 0) throw Exceptions.CAMPAIGN_CANNOT_START_WITH_NO_CONTACTS;
            this.enqueueCampaignKafka(workspaceId, updatedCampaign.id);
        }

        return { ok: true };
    }

    @CatchError()
    async deleteCampaign(workspaceId: string, campaignId: number): Promise<DoDeleteCampaignResponse> {
        const campaign = await this.campaignRepository.findOne({
            id: campaignId,
            workspaceId,
        });

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        if (campaign.status !== CampaignStatus.draft && campaign.startedAt) {
            throw Exceptions.CAMPAIGN_STARTED;
        }

        const response = await this.campaignRepository.manager.transaction(async (transactionalEntityManager) => {
            const deletedCampaign = await transactionalEntityManager.delete(Campaign, {
                id: campaignId,
                workspaceId,
            });

            if (deletedCampaign) {
                await transactionalEntityManager.delete(CampaignContact, {
                    campaignId,
                });

                await transactionalEntityManager.delete(CampaignAttribute, {
                    campaignId,
                });
            }

            return deletedCampaign;
        });

        return { ok: response.affected > 0 };
    }
}
