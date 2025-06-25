import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ChannelConfig, ChannelIdConfig } from './interfaces/channel-config.interface';
import {
    MongooseAbstractionService,
    AbstractEventData,
} from './../../common/abstractions/mongooseAbstractionService.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ChannelConfigDto, CreateEventRequest } from './dto/channel-config.dto';
import { ChannelConfigModel, ExpirationTimeType } from './schemas/channel-config.schema';
import { CatchError, Exceptions } from './../auth/exceptions';
import { BotsService } from './../../modules/bots/bots.service';
import { WorkspacesService } from './../../modules/workspaces/services/workspaces.service';
import { pick } from 'lodash';
import { Bot } from './../../modules/bots/interfaces/bot.interface';
import { Workspace } from './../../modules/workspaces/interfaces/workspace.interface';
import { KissbotEventType, KissbotEventDataType, KissbotEventSource, KissbotEvent } from 'kissbot-core';
import { UserRoles, User } from '../../modules/users/interfaces/user.interface';
import { EventsService } from './../events/events.service';
import { omit } from 'lodash';
import { isAnySystemAdmin } from '../../common/utils/roles';
import { StorageService } from '../storage/storage.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../common/utils/get-queue-name';
import { UploadingFile } from '../../common/interfaces/uploading-file.interface';
import { CacheService } from '../_core/cache/cache.service';
import { PartnerApiService } from '../channels/gupshup/services/partner-api.service';
import { ModuleRef } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { castObjectIdToString } from '../../common/utils/utils';

export type CompleteChannelConfig = Partial<ChannelConfig> & {
    workspace: Partial<Workspace>;
    bot: Partial<Bot>;
}
@Injectable()
export class ChannelConfigService extends MongooseAbstractionService<ChannelConfig> {
    private readonly logger = new Logger(ChannelConfigService.name);

    constructor(
        @InjectModel('ChannelConfig') protected readonly model: Model<ChannelConfig>,
        @Inject(forwardRef(() => BotsService))
        private readonly botService: BotsService,
        @Inject(forwardRef(() => WorkspacesService))
        private readonly workspaceService: WorkspacesService,
        private readonly storageService: StorageService,
        readonly eventsService: EventsService,
        private readonly amqpConnection: AmqpConnection,
        private readonly redisCacheService: CacheService,
        private readonly moduleRef: ModuleRef,
    ) {
        super(model, null, eventsService);
    }

    getSearchFilter(): any {}

    getEventsData(): AbstractEventData {
        return {
            create: KissbotEventType.CHANNEL_CONFIG_CREATED,
            update: KissbotEventType.CHANNEL_CONFIG_UPDATED,
            dataType: KissbotEventDataType.CHANNEL_CONFIG,
        };
    }

    async _create(configDto: ChannelConfigDto): Promise<ChannelConfig> {
        const newConfig = new ChannelConfigModel(configDto);
        if (configDto.channelId === ChannelIdConfig.webchat || configDto.channelId === ChannelIdConfig.webemulator) {
            newConfig.configData = {
                showTooltip: false,
                toolTipText: [],
                startWithConfirmation: false,
                startChatOnLoad: false,
                color: '152d4c',
            };
        }

        if (configDto.channelId === ChannelIdConfig.emulator || configDto.channelId === ChannelIdConfig.webemulator) {
            newConfig.expirationTime = {
                time: 5,
                timeType: ExpirationTimeType.hour,
            };
        }

        const createdChannelConfig = await this.create(newConfig);
        if (createdChannelConfig.channelId == ChannelIdConfig.whatsweb) {
            void this.eventsService.sendEvent({
                data: createdChannelConfig,
                dataType: KissbotEventDataType.CHANNEL_CONFIG,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CHANNEL_CONFIG_WHATSWEB_CREATED,
            });
        }

        return createdChannelConfig;
    }

    async updateCallbackUrlGupshup(token: string, appName: string, workspaceId: string, channelConfigId: string) {
        const channelConfigSameAppName = await this.model.findOne({
            _id: { $ne: channelConfigId },
            'configData.appName': { $eq: appName },
        });

        if (channelConfigSameAppName) {
            throw Exceptions.CHANNEL_CONFIG_APPNAME_ALREADY_EXISTS;
        }

        const callbackUrl =
            'https://conversation-manager.botdesigner.io/channels/whatsapp/gupshup/' +
            token +
            '?workspaceId=' +
            workspaceId;

        try {
            const partnerApiService = this.moduleRef.get<PartnerApiService>(PartnerApiService, { strict: false });
            const resultCallbackUrl = await partnerApiService.updateCallbackUrl(appName, callbackUrl);

            if (resultCallbackUrl.data.status == 'success') {
                await partnerApiService.updateWebhookOptions(appName);
                await partnerApiService.updateEnableTemplate(appName, true);
                await partnerApiService.updateEnableOptinMessage(appName, true);
            }
        } catch (error) {
            Sentry.captureEvent({
                message: 'Error ChannelConfigService.updateCallbackUrlGupshup update settings gupshup',
                extra: {
                    error: error,
                    appName,
                    workspaceId,
                    channelConfigId,
                },
            });
        }
    }

    async _update(channelConfigId, channelConfig, omitEvent?: boolean): Promise<ChannelConfig> {
        const existsChannelConfig = await this.getOne(channelConfigId);

        if (!existsChannelConfig) {
            throw Exceptions.CHANNEL_CONFIG_NOT_FOUND;
        }

        if (process.env.NODE_ENV == 'production') {
            if (
                channelConfig?.configData?.appName &&
                channelConfig?.configData?.apikey &&
                channelConfig?.configData?.phoneNumber
            ) {
                if (channelConfig.configData.appName !== existsChannelConfig?.configData?.appName) {
                    await this.updateCallbackUrlGupshup(
                        existsChannelConfig.token,
                        channelConfig.configData.appName,
                        existsChannelConfig.workspaceId,
                        castObjectIdToString(existsChannelConfig._id),
                    );
                }
            }
        }

        await this.updateRaw({ _id: channelConfigId }, channelConfig);

        const channel = await this.getOne(channelConfigId);

        try {
            await this.bindChannelConfigValidator(channel);
        } catch (err) {
            this.logger.error(err);
        }

        if (channel.channelId === ChannelIdConfig.whatsweb && !omitEvent) {
            void this.eventsService.sendEvent({
                data: channel,
                dataType: KissbotEventDataType.CHANNEL_CONFIG,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CHANNEL_CONFIG_WHATSWEB_UPDATED,
            });
        }

        try {
            this.removeChannelConfigByIdOrTokenOnCache(castObjectIdToString(channel._id));
            this.removeChannelConfigByIdOrTokenOnCache(channel.token);
        } catch (e) {
            this.logger.error('Erro on removing from cache channelconfig');
            this.logger.error(e);
        }
        return channel;
    }

    async bindChannelConfigValidator(channelConfig: ChannelConfig) {
        const params = {
            queue: getQueueName('gupshup-check-phone'),
            source: process.env.EVENT_EXCHANGE_NAME,
            pattern: KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST + `.${channelConfig.token}`,
        };

        if (channelConfig.canValidateNumber) {
            await this.amqpConnection.channel.bindQueue(params.queue, params.source, params.pattern);
        } else {
            await this.amqpConnection.channel.unbindQueue(params.queue, params.source, params.pattern);
        }
    }

    async updateAvatar(channelConfigId: string, file: UploadingFile): Promise<string> {
        const s3Key = `webchat-avatars/channel-config-${channelConfigId}/${file.originalname}`;
        const url = await this.storageService.upload(file.buffer, s3Key, file.extension);
        return url;
    }

    async _delete(channelConfigId, user?: User): Promise<any> {
        return await this.delete(channelConfigId, async (channelConfig: ChannelConfig) => {
            if (user && !!user.roles.find((role) => role.role == UserRoles.SYSTEM_ADMIN)) {
                return true;
            }
            if (channelConfig.channelId == ChannelIdConfig.webemulator) {
                throw Exceptions.CANNOT_DELETE_EMULATOR_CHANNEL_CONFIG;
            }
        });
    }

    async deleteByBotId(botId): Promise<any> {
        const channelConfigs = await this.getAll({ botId });
        await this.model.deleteMany({ botId });
        await Promise.all(
            channelConfigs.map(async (config) => {
                if (this.cacheService) {
                    await this.cacheService.remove(castObjectIdToString(config._id));
                    await this.cacheService.remove(config.token);
                }
                void this.eventsService.sendEvent({
                    data: config,
                    dataType: KissbotEventDataType.CHANNEL_CONFIG,
                    source: KissbotEventSource.KISSBOT_API,
                    type: KissbotEventType.CHANNEL_CONFIG_DELETED,
                });
            }),
        );
    }

    @CatchError()
    async getCanValidateLoggedInWrapperChannelConfig(): Promise<ChannelConfig> {
        return await this.model.findOne({ canValidateNumber: true, 'configData.status.status': 'LoggedIn' }).exec();
    }

    private getChannelConfigCacheKeyByIdOrToken(idOrToken: string) {
        return `CHANNEL_CONFIG:${idOrToken}`;
    }

    private async setChannelConfigByIdOrTokenOnCache(channelConfig: CompleteChannelConfig) {
        try {
            const cacheKey = this.getChannelConfigCacheKeyByIdOrToken(channelConfig.token);
            const client = await this.redisCacheService.getClient();
            await client.set(cacheKey, JSON.stringify(channelConfig), 'EX', 30);
        } catch (e) {
            this.logger.error('setChannelConfigByIdOrTokenOnCache');
            this.logger.error(e);
        }
    }

    private async removeChannelConfigByIdOrTokenOnCache(idOrToken: string) {
        try {
            const cacheKey = this.getChannelConfigCacheKeyByIdOrToken(idOrToken);
            const client = await this.redisCacheService.getClient();
            await client.del(cacheKey);
        } catch (e) {
            this.logger.error('removeChannelConfigByIdOrTokenOnCache');
            this.logger.error(e);
        }
    }

    private async getChannelConfigByIdOrTokenOnCache(idOrToken: string): Promise<CompleteChannelConfig> {
        try {
            const cacheKey = this.getChannelConfigCacheKeyByIdOrToken(idOrToken);
            const client = await this.redisCacheService.getClient();
            const result = await client.get(cacheKey);
            return JSON.parse(result) as CompleteChannelConfig;
        } catch (e) {
            this.logger.error('getChannelConfigByIdOrTokenOnCache');
            this.logger.error(e);
        }
    }

    async getOneBtIdOrToken(idOrToken: string): Promise<CompleteChannelConfig> {
        try {
            const completeChannelConfig: CompleteChannelConfig = await this.getChannelConfigByIdOrTokenOnCache(
                idOrToken,
            );
            if (completeChannelConfig) {
                return completeChannelConfig;
            }
        } catch (e) {
            this.logger.error('getOneBtIdOrToken - getting from cache');
            this.logger.error(e);
        }
        let channelConfig: ChannelConfig;
        try {
            channelConfig = await this.getOne(idOrToken);
        } catch (e) {
            channelConfig = await this.findOne({ token: idOrToken });
        }
        let bot: Bot;
        let workspace: Workspace;

        if (!channelConfig) return undefined;

        if (channelConfig.botId) {
            bot = await this.botService.getOne(channelConfig.botId);
        }
        if (channelConfig.workspaceId) {
            workspace = await this.workspaceService._getOne(channelConfig.workspaceId);
        }
        (channelConfig as any).bot = bot;
        (channelConfig as any).workspace = workspace;

        if (!channelConfig) {
            this.logger.debug(`idOrToken: ${idOrToken} not found`);
        }

        if (!bot) {
            this.logger.debug(`bot: ${idOrToken} not found`);
        }

        if (!workspace) {
            this.logger.debug(`workspace: ${idOrToken} not found`);
        }

        const pickedBot = pick(bot?.toJSON?.({ minimize: false }) ?? bot, ['name', '_id', 'workspaceId', 'id']);
        const pickedWorkspace = pick(workspace?.toJSON?.({ minimize: false }) ?? workspace, [
            'name',
            '_id',
            'id',
            'featureFlag',
            'timezone',
        ]);

        const completeChannelConfig = {
            ...((channelConfig.toJSON?.({ minimize: false }) ?? channelConfig) as ChannelConfig),
            bot: pickedBot,
            workspace: pickedWorkspace,
        };

        this.setChannelConfigByIdOrTokenOnCache(completeChannelConfig);

        return completeChannelConfig;
    }

    async getOneByToken(token: string): Promise<ChannelConfig> {
        return await this.findOne({ token });
    }

    @CatchError()
    async getPublicWebchatChannelConfig(idOrToken: string) {
        let channelConfig: ChannelConfig;
        try {
            channelConfig = await this.getOne(idOrToken);
        } catch (e) {
            channelConfig = await this.findOne({ token: idOrToken });
        }

        if (
            channelConfig.channelId !== ChannelIdConfig.webchat &&
            channelConfig.channelId !== ChannelIdConfig.webemulator
        ) {
            throw Exceptions.NOT_WEBCHAT_WEBEMULATOR_CHANNEL_CONFIG;
        }

        let bot: Bot;
        let workspace: Workspace;

        if (!channelConfig) return undefined;

        if (channelConfig.botId) {
            bot = await this.botService.getOne(channelConfig.botId);
        }
        if (channelConfig.workspaceId) {
            workspace = await this.workspaceService._getOne(channelConfig.workspaceId);
        }

        (channelConfig as any).bot = bot;
        (channelConfig as any).workspace = workspace;
        return omit(
            {
                ...(channelConfig?.toJSON?.({ minimize: false }) ?? channelConfig),
                bot: pick(bot?.toJSON?.({ minimize: false }) ?? bot, ['name', '_id', 'workspaceId', 'id']),
                workspace: pick(workspace?.toJSON?.({ minimize: false }) ?? workspace, ['name', '_id', 'id']),
            },
            ['attendancePeriods'],
        );
    }

    public async _queryPaginate(query: any, user: User) {
        const { filter } = query;
        if ((filter?.channelId && filter.channelId === ChannelIdConfig.whatsweb) || isAnySystemAdmin(user)) {
            return await this.queryPaginate(query);
        }
        return await this.queryPaginate({
            ...query,
            projection: {
                'configData.apikey': 0,
                'configData.appName': 0,
            },
        });
    }

    /**
     * Verifica se o request do controller passou um evento válido para ser criado.
     * Não pode ser qualquer evento que pode ser criado via http, alguns eventos só podem ser disparados de
     *   dentro da API, como por exemplo eventos de CRUD. Ex: INTERACTION_CREATED
     * @param type
     */
    private async canCreateEventFromController(type: KissbotEventType): Promise<boolean> {
        const possibleControllerEvents: KissbotEventType[] = [
            KissbotEventType.WHATSWEB_DRIVER_STATUS_REQUEST,
            KissbotEventType.WHATSWEB_QRCODE_REQUEST,
            KissbotEventType.WHATSWEB_SCREENSHOT_REQUEST,
            KissbotEventType.WHATSWEB_SYNC_CHAT_REQUEST,
            KissbotEventType.WHATSWEB_SYNC_CONTACTS_REQUEST,
            KissbotEventType.WHATSWEB_USE_HERE_REQUEST,
            KissbotEventType.WHATSWEB_IMPORT_CONTACTS_REQUEST,
            KissbotEventType.WHATSWEB_IMPORT_MESSAGES_REQUEST,
        ];
        return !!possibleControllerEvents.find((possibleEventType) => possibleEventType == type);
    }

    private getRoutingKeyByEvent(type: KissbotEventType, requestDto: CreateEventRequest): string {
        switch (type) {
            case KissbotEventType.WHATSWEB_DRIVER_STATUS_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_QRCODE_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_SCREENSHOT_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_SYNC_CHAT_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_SYNC_CONTACTS_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_USE_HERE_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_IMPORT_CONTACTS_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
            case KissbotEventType.WHATSWEB_IMPORT_MESSAGES_REQUEST: {
                return `${type}.${requestDto.data.token}`;
            }
        }
        return type;
    }

    async sendEventFromController(idOrToken: string, requestDto: CreateEventRequest) {
        const channelConfig = await this.getOneBtIdOrToken(idOrToken);
        if (channelConfig.channelId != ChannelIdConfig.whatsweb) throw Exceptions.CHANNEL_CONFIG_EVENT_NOT_VALID;
        const type = requestDto.eventType;
        if (await this.canCreateEventFromController(type)) {
            const { data, dataType } = requestDto;
            const event: KissbotEvent = {
                source: KissbotEventSource.KISSBOT_API,
                dataType,
                type,
                data: this.removeBase64Fields(data),
            };
            const customRoutingKey = this.getRoutingKeyByEvent(event.type, requestDto);
            return this.eventsService.sendEvent(event, customRoutingKey);
        }
        throw Exceptions.EVENT_CANNOT_BE_SENDED;
    }

    private async removeBase64Fields(channelConfig: ChannelConfig) {
        channelConfig = omit(channelConfig, ['configData.status.screenshot']) as ChannelConfig;
        channelConfig = omit(channelConfig, ['configData.screenshot']) as ChannelConfig;
        return channelConfig;
    }

    async getGupshupValidators() {
        return await this.model.find({
            channelId: ChannelIdConfig.gupshup,
            enable: true,
            canValidateNumber: true,
        });
    }

    async disableWorkspaceChannelConfigs(workspaceId: string) {
        return await this.model.updateMany({ workspaceId }, { $set: { enable: false } });
    }

    @CatchError()
    async getChannelConfigByWorkspaceIdAndGupshup(workspaceId: string) {
        return await this.getAll({ workspaceId, channelId: ChannelIdConfig.gupshup });
    }

    @CatchError()
    async getChannelConfigByWorkspaceAndChannelId(workspaceId: string, channelId: ChannelIdConfig) {
        return await this.getAll({ workspaceId, channelId });
    }

    @CatchError()
    async setDefaultExpirationInEmulator() {
        return await this.updateMany(
            {
                $or: [
                    {
                        channelId: ChannelIdConfig.webemulator,
                    },
                    {
                        channelId: ChannelIdConfig.emulator,
                    },
                ],
            },
            {
                $set: {
                    expirationTime: {
                        time: 5,
                        timeType: ExpirationTimeType.hour,
                    },
                },
            },
        );
    }
}
