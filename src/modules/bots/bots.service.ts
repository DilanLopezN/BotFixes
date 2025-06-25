import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bot } from './interfaces/bot.interface';
import { MongooseAbstractionService } from '../../common/abstractions/mongooseAbstractionService.service';
import { Model } from 'mongoose';
import { omit } from 'lodash';
import { ChannelIdConfig } from '../channel-config/interfaces/channel-config.interface';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { User, PermissionResources, UserRoles } from '../users/interfaces/user.interface';
import { WorkspacesService } from './../workspaces/services/workspaces.service';
import { Exceptions } from './../auth/exceptions';
import { EventsService } from './../events/events.service';
import { BotDto } from './dtos/botDto.dto';
import { BotModel } from './schemas/bot.schema';
import { v4 } from 'uuid';
import { ChannelConfigService } from './../channel-config/channel-config.service';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { CacheService } from './../_core/cache/cache.service';
import { BotAttributesService } from '../../modules/botAttributes/botAttributes.service';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '../../common/utils/roles';
import * as moment from 'moment';
import { ExternalDataService } from './services/external-data.service';
import { castObjectIdToString } from '../../common/utils/utils';

@Injectable()
export class BotsService extends MongooseAbstractionService<Bot> {
    constructor(
        @InjectModel('Bot') protected readonly model: Model<Bot>,
        private readonly externalDataService: ExternalDataService,
        @Inject(forwardRef(() => WorkspacesService))
        private readonly workspaceService: WorkspacesService,
        readonly eventsService: EventsService,
        @Inject(forwardRef(() => ChannelConfigService))
        private readonly channelConfigService: ChannelConfigService,
        @Inject(forwardRef(() => BotAttributesService))
        private readonly botAttributesService: BotAttributesService,
        cacheService: CacheService,
    ) {
        super(model, cacheService, eventsService);
    }

    getSearchFilter() {}
    getEventsData() {}

    public async createBot(bot: Bot, cloned = false): Promise<Bot> {
        let workspace = await this.workspaceService.getOne(bot.workspaceId);

        if (!workspace?.dialogFlowAccount?.client_id) {
            throw Exceptions.WORKSPACE_DOES_NOT_HAVE_DIALOGFLOW_ACCOUNT;
        }

        const newBot: Bot = await this.create(bot);

        try {
            if (!cloned) {
                await this.externalDataService.initBotInteraction(newBot.workspaceId, castObjectIdToString(newBot._id));
            }
        } catch (error) {}

        await this.channelConfigService._create({
            name: 'webemulator',
            token: v4(),
            keepLive: false,
            enable: true,
            botId: castObjectIdToString(newBot._id),
            workspaceId: bot.workspaceId as any,
            channelId: ChannelIdConfig.webemulator,
            configData: {
                color: '152d4c',
                avatar: 'https://launcher-test.kissbot.ai/assets/avatars/avatar_0002.png',
            },
        });

        await this.eventsService.sendEvent({
            data: newBot,
            dataType: KissbotEventDataType.BOT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.BOT_CREATED,
        });
        return newBot;
    }

    public async getAll(objectParams = {}): Promise<Bot[]> {
        return await this.model.find({ ...objectParams, deletedAt: { $eq: null } }).exec();
    }

    queryByRoles(user: User, query: QueryStringFilter, workspaceId: string) {
        const filter: any = {};
        const isAnyAdmin = isAnySystemAdmin(user);

        if (!isAnyAdmin) {
            filter._id = {
                $in: user.roles
                    .filter(
                        (role) =>
                            role.resource == PermissionResources.BOT &&
                            !!role.resourceId &&
                            (role.role == UserRoles.BOT_ADMIN || role.role == UserRoles.BOT_DEVELOP),
                    )
                    .map((role) => role.resourceId),
            };
        }

        const workspaceAdmin = isWorkspaceAdmin(user, workspaceId);

        let filterObj: any = {
            workspaceId,
        };

        if (!workspaceAdmin) {
            filterObj = { ...filterObj, ...filter };
        }

        query.filter = { ...query.filter, ...filterObj };

        return this.queryPaginate(query);
    }

    public async getInfoBotConfig(workspaceId, botId) {
        let bot = await this.getOne(botId);

        const attributes = await this.botAttributesService.getAll({ botId });

        if (!bot) {
            throw Exceptions.BOT_NOT_FOUND;
        }

        let workspace = await this.workspaceService.getOne(workspaceId || bot.workspaceId);

        try {
            this.externalDataService.setBotInteractionToCache(botId);
        } catch (e) {
            console.log('E', e);
        }

        return {
            bot: omit(bot.toJSON?.({ minimize: false }) ?? bot, ['createdAt', 'updatedAt', 'languages', 'labels']),
            workspace: omit(workspace.toJSON?.({ minimize: false }) ?? workspace, [
                'dialogFlowAccount',
                'createdAt',
                'updatedAt',
            ]),
            dialogFlowAccount: workspace.dialogFlowAccount,
            attributes,
        };
    }

    async _update(botId, botDto: BotDto | Bot, user?: User) {
        const updateBot = new BotModel();
        Object.assign(updateBot, botDto);

        if (botDto.publishDisabled?.disabled && !!user) {
            updateBot.publishDisabled = {
                ...botDto.publishDisabled,
                disabledAt: +new Date(),
                user: {
                    id: castObjectIdToString(user._id),
                    name: user.name,
                },
            };
        }

        this.eventsService.sendEvent({
            data: updateBot,
            dataType: KissbotEventDataType.BOT,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.BOT_UPDATED,
        });

        return await this.update(botId, updateBot);
    }

    async _delete(botId) {
        try {
            const bot = await this.getOne(botId);
            await Promise.all([this.channelConfigService.deleteByBotId(botId), this.delete(botId)]);
            this.eventsService
                .sendEvent({
                    data: bot,
                    dataType: KissbotEventDataType.BOT,
                    source: KissbotEventSource.KISSBOT_API,
                    type: KissbotEventType.BOT_DELETED,
                })
                .catch(console.log);
            return bot;
        } catch (e) {
            console.log(`BotsService:_delete:${e}`);
        }
    }

    async publish(botId: string, workspaceId: string, user: User, comment?: string): Promise<void | never> {
        const bot = await this.model.findOne({
            _id: botId,
            workspaceId: workspaceId,
        });

        if (bot) {
            if (
                !bot?.publishDisabled?.disabled ||
                (bot?.publishDisabled?.disabled &&
                    castObjectIdToString(bot?.publishDisabled?.user?.id) === castObjectIdToString(user._id)) ||
                isSystemAdmin(user)
            ) {
                await this.externalDataService.publish(botId, workspaceId, castObjectIdToString(user._id), comment);

                if (bot?.publishDisabled) {
                    if (bot.publishDisabled?.disabled) {
                        bot.publishDisabled.user = {
                            id: castObjectIdToString(user._id),
                            name: user.name,
                        };
                    } else {
                        bot.publishDisabled.user = undefined;
                    }
                }
                bot.publishedAt = moment().toDate();
                await this._update(botId, bot, undefined);
            } else {
                throw new BadRequestException({
                    message: 'BOT_PUBLISH_DISABLED',
                    user: bot.publishDisabled.user,
                });
            }
        }
    }

    async validateBotPublication(botId: string, workspaceId: string, user: User) {
        const bot = await this.model.findOne({
            _id: botId,
            workspaceId: workspaceId,
        });

        if (!bot) {
            throw Exceptions.BOT_NOT_FOUND;
        }
        if (!isSystemAdmin(user)) {
            if (
                !!bot?.publishDisabled?.disabled &&
                castObjectIdToString(bot?.publishDisabled?.user?.id) !== castObjectIdToString(user?._id)
            ) {
                throw new BadRequestException({
                    message: 'BOT_PUBLISH_DISABLED',
                    user: bot.publishDisabled.user,
                });
            }
        }
    }

    async updateBotUpdatedAt(botId: string, updatedAt: number): Promise<void> {
        const bot = await this.findOne({ _id: botId });
        const updateBot = new BotModel();
        updateBot.updatedAt = new Date(updatedAt);
        // updateBot estava com publishedAt default sobrescrevendo oq estava no Bot
        updateBot.publishedAt = bot?.publishedAt || updateBot.publishedAt;
        await this._update(botId, updateBot, undefined);
    }
}
