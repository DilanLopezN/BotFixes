import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { chunk, omit } from 'lodash';
import * as moment from 'moment';
import { PaginatedModel } from '../../../common/interfaces/paginated';
import { FindConditions, In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { SendActiveMessageData } from '../../active-message/interfaces/send-active-message-data.interface';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { CacheService } from '../../_core/cache/cache.service';
import { CampaignResume } from '../interfaces/campaign-resume.interface';
import { CreateCampaignData } from '../interfaces/create-campaign-data.interface';
import { UpdateCampaignData } from '../interfaces/update-campaign-data.interface';
import { CampaignAttribute } from '../models/campaign-attributes.entity';
import { CampaignContact } from '../models/campaign-contact.entity';
import { Campaign, CampaignStatus } from '../models/campaign.entity';
import { ContactAttribute } from '../models/contact-attribute.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { CampaignContactService } from './campaign-contact.service';
import { ContactService } from './contact.service';
import { ExternalDataService } from './external-data.service';
import { ObjectiveType } from '../../active-message/models/active-message-setting.entity';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';
import { KafkaService } from '../../_core/kafka/kafka.service';
import * as Sentry from '@sentry/node';

export const campaignTopicName = `campaign_start`;

export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);
    constructor(
        @InjectRepository(Campaign, CAMPAIGN_CONNECTION)
        private campaignRepository: Repository<Campaign>,
        private readonly contactService: ContactService,
        private readonly externalDataService: ExternalDataService,
        @Inject(forwardRef(() => CampaignContactService))
        private readonly campaignContactService: CampaignContactService,
        public cacheService: CacheService,
        private kafkaService: KafkaService,
    ) {}

    @CatchError()
    async getPauseCacheKey(campaignId: number) {
        return `CAMPAIGN_PAUSED_${campaignId}`;
    }

    @CatchError()
    async pauseCampaign(workspaceId: string, campaignId: number) {
        const campaignCount = await this.campaignRepository.count({ id: campaignId, workspaceId });
        if (!campaignCount) {
            throw Exceptions.CANNOT_STOP_INVALID_CAMPAIGN;
        }
        await this.campaignRepository.update({ id: campaignId }, { status: CampaignStatus.paused });

        const pauseCacheKey = await this.getPauseCacheKey(campaignId);
        const client = this.cacheService.getClient();
        await client.set(pauseCacheKey, 'true');
    }

    @CatchError()
    async createCampaign(data: CreateCampaignData) {
        const activeMessageSettingList = await this.externalDataService.listEnabledByWorkspaceId(
            data.workspaceId,
            ObjectiveType.campaign,
        );
        if (activeMessageSettingList.length === 1 && !data.activeMessageSettingId) {
            data.activeMessageSettingId = activeMessageSettingList[0].id;
        }
        return await this.campaignRepository.save({
            ...data,
            createdAt: moment().valueOf(),
        });
    }

    @CatchError()
    async checkTemplateUsage(workspaceId: string, templateId: string) {
        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .where('cmp.workspace_id = :workspaceId', { workspaceId: workspaceId })
            .andWhere('cmp.template_id = :templateId', { templateId: templateId })
            .andWhere('cmp.ended_at IS null')
            .getOne();

        return !!campaign;
    }

    @CatchError()
    async cloneCampaign(data: CreateCampaignData) {
        const campaign = await this.campaignRepository.findOne({
            id: data.clonedFrom,
            workspaceId: data.workspaceId,
        });

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        const newCampaign = await this.campaignRepository.manager.transaction(async (transactionalEntityManager) => {
            const newCampaign = await transactionalEntityManager.save(Campaign, {
                ...data,
                createdAt: moment().valueOf(),
                activeMessageSettingId: campaign.activeMessageSettingId,
                status: CampaignStatus.draft,
                sendInterval: campaign.sendInterval,
                templateId: campaign.templateId,
                campaignType: campaign.campaignType,
                description: campaign.description,
            });

            if (newCampaign) {
                const campaignAttributes = await transactionalEntityManager.find(CampaignAttribute, {
                    campaignId: campaign.id,
                });

                if (campaignAttributes.length) {
                    const newCampaignAttributes = [];

                    for (const attribute of campaignAttributes) {
                        newCampaignAttributes.push({
                            ...omit(attribute, ['id']),
                            campaignId: newCampaign.id,
                        });
                    }

                    for (const group of chunk(newCampaignAttributes, 50)) {
                        await transactionalEntityManager.save(CampaignAttribute, group);
                    }
                }

                const campaignContacts = await transactionalEntityManager.find(CampaignContact, {
                    campaignId: campaign.id,
                });

                if (campaignContacts.length) {
                    const newCampaignContacts = [];

                    for (const contact of campaignContacts) {
                        newCampaignContacts.push({
                            ...omit(contact, ['id']),
                            campaignId: newCampaign.id,
                        });
                    }

                    for (const group of chunk(newCampaignContacts, 50)) {
                        await transactionalEntityManager.save(CampaignContact, group);
                    }
                }
            }
            return newCampaign;
        });

        return newCampaign;
    }

    @CatchError()
    async canUpdateCampaign(campaignId: number) {
        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .where('cmp.id = :campaignId', { campaignId: campaignId })
            .getOne();

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        if (campaign.status === CampaignStatus.finished_complete || campaign.endedAt !== null) {
            throw Exceptions.CAMPAIGN_SENDED;
        }
    }

    @CatchError()
    async updateCampaign(data: UpdateCampaignData) {
        if (!data.name) {
            delete data.name;
        }

        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .where('cmp.id = :campaignId', { campaignId: data.id })
            .getOne();

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        if (campaign.status === CampaignStatus.finished_complete || campaign.endedAt !== null) {
            throw Exceptions.CAMPAIGN_SENDED;
        }

        let isAwaitingSend: boolean = false;
        if (
            campaign &&
            (campaign.templateId || data.templateId) &&
            (campaign.activeMessageSettingId || data.activeMessageSettingId)
        ) {
            isAwaitingSend = true;
        }
        return await this.campaignRepository.update(
            {
                id: data.id,
                status: In([CampaignStatus.draft, CampaignStatus.awaiting_send]),
            },
            {
                ...data,
                status: isAwaitingSend ? CampaignStatus.awaiting_send : CampaignStatus.draft,
            },
        );
    }

    @CatchError()
    async deleteCampaign(workspaceId: string, campaignId: number) {
        const campaign = await this.campaignRepository.findOne({
            id: campaignId,
            workspaceId: workspaceId,
        });

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }

        if (campaign.status === CampaignStatus.draft || !campaign.startedAt) {
            const response = await this.campaignRepository.manager.transaction(async (transactionalEntityManager) => {
                const campaignDeleted = await transactionalEntityManager.delete(Campaign, {
                    id: campaignId,
                    workspaceId: workspaceId,
                });

                if (campaignDeleted) {
                    await transactionalEntityManager.delete(CampaignContact, {
                        campaignId: campaignId,
                    });

                    await transactionalEntityManager.delete(CampaignAttribute, {
                        campaignId: campaignId,
                    });
                }

                return campaignDeleted;
            });

            if (response.affected > 0) {
                return { ok: true };
            }
            return { ok: false };
        }
    }

    @CatchError()
    async getCampaignByWorkspace(
        workspaceId: string,
        query?: { skip?: number; limit?: number; isTest?: boolean },
    ): Promise<PaginatedModel<Campaign>> {
        const skip = query?.skip || 0;
        const limit = query?.limit || 4;

        let q = await this.campaignRepository
            .createQueryBuilder('camp')
            .where('camp.workspace_id = :workspaceId', { workspaceId })
            .skip(skip)
            .take(limit)
            .orderBy('camp.id', 'DESC');

        if (query.isTest) {
            q = q.andWhere('camp.is_test IS true');
        } else {
            q = q.andWhere('camp.is_test IS NOT true');
        }

        const [result, total] = await q.getManyAndCount();

        for (const item of result) {
            const resume = await this.getCampaignResume(item.id);
            item.resume = resume;
        }

        return {
            count: total,
            data: result,
            currentPage: skip / limit + 1,
            nextPage: null,
        };
    }

    @CatchError()
    async getCampaignResume(campaignId: number): Promise<CampaignResume> {
        const contactResume = await this.contactService.getCampaignContactsResume(campaignId);
        const invalidContacts = await this.campaignContactService.getInvalidContactList(campaignId);
        return { contactResume, invalidContacts };
    }

    @CatchError()
    async getCampaignById(campaignId: number): Promise<Campaign> {
        let campaign = await this.campaignRepository.findOne({
            id: campaignId,
        });

        if (campaign) {
            const resume = await this.getCampaignResume(campaign.id);
            campaign.resume = resume;
        }
        return campaign;
    }

    @CatchError()
    async updateProcessingStatus(
        campaignId: number,
        processingTotal: number,
        processedTotal: number,
        processingFinished: boolean,
    ): Promise<any> {
        return await this.campaignRepository.update(
            {
                id: campaignId,
            },
            {
                processedTotal,
                processingTotal,
                processingFinished,
            },
        );
    }

    @CatchError()
    async startCampaign(campaignId: number) {
        const q = await this.campaignRepository
            .createQueryBuilder('cmp')
            .leftJoinAndMapMany('cmp.campaignAttributes', CampaignAttribute, 'attr', 'attr.campaign_id = cmp.id')
            .innerJoinAndMapMany('cmp.campaignContact', CampaignContact, 'cmpCtt', 'cmpCtt.campaign_id = cmp.id')
            .where('cmp.id = :campaignId', { campaignId });

        const campaign = await q.getOne();
        if (!campaign) {
            this.logger.debug(`Cannot start campaign with no contact or attributes cmpId: ${campaignId}`);
            return;
        }
        const activeMessageSetting = await this.externalDataService.getOneActiveMessageSetting(
            campaign.activeMessageSettingId,
        );
        if (!campaign) {
            throw Exceptions.CANNOT_START_INVALID_CAMPAIGN;
        }

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
                        teamId: '',
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

                    await this.campaignContactService.updateCampaignContactSendedAt(contact.campaignContact.id);

                    if (i < contacts.length - 1) {
                        if (campaign.sendInterval) {
                            await new Promise((res, _) => setTimeout(res, campaign.sendInterval));
                        }
                    }
                } catch (error) {
                    console.log('ERROR CampaignService.startCampaign sendMessage: ', error);
                    Sentry.captureEvent({
                        message: 'ERROR CampaignService.startCampaign sendMessage',
                        extra: {
                            error: error,
                            contact,
                            campaign,
                        },
                    });
                }
            }
        } catch (error) {
            console.log('ERROR CampaignService.startCampaign: ', error);
            Sentry.captureEvent({
                message: 'ERROR CampaignService.startCampaign',
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

    @Cron(CronExpression.EVERY_5_MINUTES)
    private async startScheduledCampaign() {
        if (!shouldRunCron()) return;
        const now = moment().valueOf();
        const campaigns = await this.campaignRepository.find({
            where: {
                sendAt: LessThanOrEqual(now),
                status: CampaignStatus.awaiting_send,
            },
            select: ['id', 'workspaceId'],
        });
        this.logger.log(`Starting ${campaigns.length} scheduled campaigns`);
        for (const campaign of campaigns) {
            this.logger.log(`RUNNIGN CRON CAMPAIGN - ID: ${campaign.id}`);
            this.enqueueCampaignKafka(campaign.workspaceId, campaign.id);
        }
        this.logger.log(`End ${campaigns.length} scheduled campaigns`);
    }

    private enqueueCampaignKafka(workspaceId: string, campaignId: number) {
        this.kafkaService.sendEvent({ campaignId }, workspaceId, campaignTopicName);
    }

    @CatchError()
    async updateCampaignIsTest(workspaceId: string, campaignId: number, isTest: boolean) {
        const campaign = await this.campaignRepository
            .createQueryBuilder('cmp')
            .where('cmp.id = :campaignId', { campaignId: campaignId })
            .andWhere('cmp.workspace_id = :workspaceId', { workspaceId: workspaceId })
            .getOne();

        if (!campaign) {
            throw Exceptions.CAMPAIGN_NOT_FOUND;
        }
        return await this.campaignRepository.update(
            {
                id: campaign.id,
            },
            {
                isTest: isTest,
            },
        );
    }
}
