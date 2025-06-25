import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InteractionsService } from '../interactions/services/interactions.service';
import { Interaction } from '../interactions/interfaces/interaction.interface';
import { ILanguageInteraction } from '../interactions/interfaces/language.interface';
import { IEngineInteraction } from './interafces/engine-interaction.interface';
import { Bot } from '../bots/interfaces/bot.interface';
import { BotsService } from '../bots/bots.service';
import { EntitiesService } from '../entities/entities.service';
import { Entity, Entry, EntityAttribute, EntryAttribute } from '../entities/interfaces/entity.interface';
import { IAttribute } from 'kissbot-core';
import { omit } from 'lodash';
import { Exceptions } from '../auth/exceptions';
import { GetAcceptedPrivacyPolicyDto, SetAcceptedPrivacyPolicyDto } from './dtos/accepted-privacy-policy.dto';
import { ExternalDataService } from './services/external-data.service';

@Injectable()
export class EngineService {
    constructor(
        @Inject(forwardRef(() => InteractionsService))
        private readonly interactionsService: InteractionsService,
        private readonly botService: BotsService,
        private readonly entityService: EntitiesService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    public async getBot(_: string, botId: string): Promise<Bot> {
        const bot = await this.botService.getOne(botId);
        return bot;
    }

    public async getWelcomeInteraction(
        _: string,
        botId: string,
        language: string,
        published: boolean,
    ): Promise<IEngineInteraction | Interaction> {
        const welcome = await this.interactionsService.getWelcomeInteraction(botId, published);
        return this.filterInteractionByLanguage(welcome, language);
    }

    public async getFallbackInteraction(
        _: string,
        botId: string,
        interactionId: string,
        language: string,
        published: boolean,
    ): Promise<IEngineInteraction | Interaction> {
        const fallback = await this.interactionsService.getFallbackInteraction(botId, interactionId, published);
        return this.filterInteractionByLanguage(fallback, language);
    }

    public async getInteractionContextFallback(
        _: string,
        botId: string,
        interactionId: string,
        language: string,
        published: boolean,
    ): Promise<IEngineInteraction | Interaction> {
        const fallback = await this.interactionsService.getInteractionContextFallback(botId, interactionId, published);
        return this.filterInteractionByLanguage(fallback, language);
    }

    public async filterInteractionsByArgs(
        _: any,
        botId: any,
        args: any,
        language: string,
        published: boolean,
    ): Promise<Array<Interaction | IEngineInteraction>> {
        const interactionList: Interaction[] = await this.interactionsService.filterInteractionsByArgs(
            botId,
            args,
            published,
        );
        return this.mapInteractionList(interactionList, language);
    }

    public async getInteractionByContextAndContainIntent(
        botId: string,
        interactionContext: string,
        intent: string,
        language: string,
        published: boolean,
    ): Promise<IEngineInteraction | Interaction> {
        const interaction = await this.interactionsService.getInteractionByContextAndContainIntent(
            botId,
            interactionContext,
            intent,
            published,
        );
        return this.filterInteractionByLanguage(interaction, language);
    }

    public async getInteractionChildrens(
        interactionId: string,
        language: string,
        published: boolean,
    ): Promise<Array<Interaction | IEngineInteraction>> {
        const interactionList: Interaction[] = await this.interactionsService.getInteractionChildrens(
            interactionId,
            published,
        );
        return this.mapInteractionList(interactionList, language);
    }

    public getInfoBotsConfig(workspaceId, botId) {
        return this.botService.getInfoBotConfig(workspaceId, botId);
    }

    public async getInteractionsByIds(interactionIds: string, language: string, published: boolean) {
        if (interactionIds && interactionIds.split(',').length > 0) {
            const interactionList: Interaction[] = await this.interactionsService.getInteractionsByIds(
                interactionIds,
                published,
            );

            return this.mapInteractionList(interactionList, language);
        }

        return [];
    }

    public async getInteractionByTriggerAndBotId(
        _: string,
        botId: string,
        trigger: string,
        language: string,
        currentInteractionId: string,
        published: boolean,
    ) {
        const interaction = await this.interactionsService.getInteractionByTriggerAndBotId(
            botId,
            trigger,
            currentInteractionId,
            published,
        );
        return this.filterInteractionByLanguage(interaction, language);
    }

    public async getInteractionById(interactionId: string, language: string, published: boolean) {
        const interaction: Interaction = await this.interactionsService.getOne(interactionId, published);
        return this.filterInteractionByLanguage(interaction, language);
    }

    private mapInteractionList(interactionList: Interaction[], language) {
        return interactionList.map((interaction: Interaction) => {
            return this.filterInteractionByLanguage(interaction, language);
        });
    }

    private filterInteractionByLanguage(interaction: Interaction, language: string): IEngineInteraction | Interaction {
        if (!interaction) return;

        const findedLanguage: ILanguageInteraction = interaction.languages.find(
            (languageInteraction: ILanguageInteraction) => {
                return languageInteraction.language == language;
            },
        );

        const leanInteraction: IEngineInteraction | Interaction = (interaction.toJSON?.({ minimize: false }) ??
            interaction) as IEngineInteraction | Interaction;

        if (!findedLanguage) {
            return leanInteraction;
        }

        const newInteractionObj = {
            ...(omit(leanInteraction, ['languages']) as any),
            responses: findedLanguage.responses,
            userSays: findedLanguage.userSays,
            intents: findedLanguage?.intents || [],
        } as IEngineInteraction;

        if (newInteractionObj.params) {
            newInteractionObj.params.dialogFlow = null;
        }

        // Remove languages, pois não é necessário para o engine
        return { ...newInteractionObj, languages: undefined } as IEngineInteraction;
    }

    public async getEntry(workspaceId: string, entityName: string, entryName: string): Promise<Array<IAttribute>> {
        let engineEntityAttributes: Array<IAttribute> = [];
        if (!entityName || entityName.length == 0) {
            return engineEntityAttributes;
        }

        if (entityName.startsWith('@')) {
            entityName = entityName.substr(1);
        }

        const entity: Entity = await this.entityService.findOne({
            workspaceId,
            name: entityName,
            deletedAt: { $eq: null },
        });

        if (entity) {
            const entry: Entry = entity.entries.find((entryItem) => entryItem.name == entryName);
            if (entry) {
                engineEntityAttributes = entry.entryAttributes.map((entryAttrItem: EntryAttribute) => {
                    const entityAttr: EntityAttribute = entity.entityAttributes.find(
                        (entityAttrItem: EntityAttribute) => entityAttrItem.id == entryAttrItem.entityAttributeId,
                    );
                    return {
                        type: entityAttr.type as string,
                        value: entryAttrItem.value as string,
                        name: entityAttr.name as string,
                    };
                });
            }
        }

        if (entity && entity.entityAttributes.length != engineEntityAttributes.length) {
            const missingAttrs: EntityAttribute[] = entity.entityAttributes.filter((entityAttribute) => {
                return !engineEntityAttributes.find((engineAttr) => engineAttr.name == entityAttribute.name);
            });
            missingAttrs.forEach((missingAttr) => {
                engineEntityAttributes.push({
                    type: missingAttr.type as string,
                    value: '' as string,
                    name: missingAttr.name as string,
                });
            });
        }

        return engineEntityAttributes;
    }

    public getEntity(workspaceId: string, entityName: string): Promise<Entity> {
        if (entityName.startsWith('@')) {
            entityName = entityName.substr(1);
        }
        return this.entityService.findOne({
            workspaceId,
            name: entityName,
            deletedAt: { $eq: null },
        });
    }

    public async setAcceptedPrivacyPolicy(workspaceId: string, data: SetAcceptedPrivacyPolicyDto) {
        return await this.externalDataService.setAcceptedPrivacyPolicy(workspaceId, data);
    }

    public async getAcceptedPrivacyPolicyByPhone(workspaceId: string, data: GetAcceptedPrivacyPolicyDto) {
        return await this.externalDataService.getAcceptedPrivacyPolicyByPhoneFromCache(workspaceId, data);
    }

    public async getPrivacyPolicyByChannelConfigIdOrChannelConfigToken(workspaceId: string, channelConfigId: string) {
        return await this.externalDataService.getPrivacyPolicyByChannelConfigIdOrChannelConfigToken(
            workspaceId,
            channelConfigId,
        );
    }

    public async getMessageByScheduleId(workspaceId: string, scheduleId: string) {
        try {
            if (!workspaceId || !scheduleId) {
                return null;
            }

            const schedule = await this.externalDataService.getScheduleByScheduleId(workspaceId, scheduleId);
            const templateId = schedule?.confirmationSetting?.templateId || schedule?.sendSetting?.templateId;

            if (!templateId) {
                return null;
            }

            const attributes = await this.externalDataService.getAttributesBySchedule(schedule);
            const template = await this.externalDataService.getTemplateById(templateId);

            const newAttributes = (attributes || [])?.map((attr) => ({ key: attr.name, value: attr.value }));
            const result = await this.externalDataService.getParsedTemplate(templateId, newAttributes);
            const buttons = (template?.buttons || []).map((button) => ({ text: button.text }));

            return { text: result, buttons };
        } catch (error) {
            console.log('Error EngineService.getMessageByScheduleId: ', error);
            return null;
        }
    }

    public async getCancelReasonByIds(workspaceId: string, reasonIds: number[]) {
        try {
            if (!workspaceId || !reasonIds?.length) {
                return null;
            }

            return await this.externalDataService.findCancelReasonByWorkspaceIdAndIds(workspaceId, reasonIds);
        } catch (error) {
            console.log('Error EngineService.getCancelReasonByIds: ', error);
            return null;
        }
    }

    public async getAudioTranscriptionByActivityId(workspaceId: string, activityId: string, createdBy: string) {
        try {
            if (!workspaceId || !activityId || !createdBy) {
                return null;
            }

            return await this.externalDataService.getAudioTranscriptionByActivityId(workspaceId, activityId, createdBy);
        } catch (error) {
            console.log('Error EngineService.getAudioTranscriptionByActivityId: ', error);
            return null;
        }
    }

    public async getSchedulesByGroupId(workspaceId: string, groupId: string) {
        try {
            if (!workspaceId || !groupId) {
                return null;
            }

            return await this.externalDataService.getSchedulesByGroupId(workspaceId, groupId);
        } catch (error) {
            console.log('Error EngineService.getSchedulesByGroupId: ', error);
            return null;
        }
    }
}
