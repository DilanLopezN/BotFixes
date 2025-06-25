import { AuthApiGuard } from './../auth/guard/auth-api.guard';
import { Controller, Get, Param, Query, Post, Body, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EngineService } from './engine.service';
import { Bot } from '../bots/interfaces/bot.interface';
import { EntityQueryDto } from './dtos/entity-query.dto';
import { castStringToBoolean } from '../../common/utils/utils';
import { GetAcceptedPrivacyPolicyDto, SetAcceptedPrivacyPolicyDto } from './dtos/accepted-privacy-policy.dto';
import { GetMessageByScheduleDto } from './dtos/message-by-schedule-id.dto';
import { ReasonIdsQueryDto, UpdateScheduleMessageReasonIdsQueryDto } from './dtos/cancel-reason.dto';
import { AudioTranscriptionQueryDto } from './dtos/audio-transcription.dto';
import { BotAudioTranscriptionFeatureFlagGuard } from './guards/bot-audio-transcription-feature-flag.guard';
import { GetSchedulesByGroupIdDto } from './dtos/schedules-by-group_id.dto';

@ApiTags('Engine')
@Controller('internal')
@UseGuards(AuthApiGuard)
export class EngineController {
    constructor(protected engineService: EngineService) {}

    @Get('/engine/:workspaceId/:botId')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    bot(@Param('workspaceId') workspaceId: string, @Param('botId') botId: string): Promise<Bot> {
        return this.engineService.getBot(workspaceId, botId);
    }

    @Get('/engine/:workspaceId/:botId/welcome')
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    welcome(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getWelcomeInteraction(workspaceId, botId, language, castStringToBoolean(published));
    }

    @Get('/engine/:workspaceId/:botId/fallback')
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    fallback(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getFallbackInteraction(
            workspaceId,
            botId,
            null,
            language,
            castStringToBoolean(published),
        );
    }

    @Get('/engine/:workspaceId/:botId/interaction/:interactionId/fallback')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiParam({ name: 'interactionId', type: String, required: true, description: 'interaction id' })
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    contextFallback(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Param('interactionId') interactionId: string,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getInteractionContextFallback(
            workspaceId,
            botId,
            interactionId,
            language,
            castStringToBoolean(published),
        );
    }

    @Get('/engine/:workspaceId/:botId/interaction/:interactionId/children')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiParam({ name: 'interactionId', type: String, required: true, description: 'interaction' })
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    childrens(
        @Param('interactionId') interactionId: string,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getInteractionChildrens(interactionId, language, castStringToBoolean(published));
    }

    @Get('/engine/:workspaceId/:botId/interaction/:interactionId/rasa-intent')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiParam({ name: 'interactionId', type: String, required: true, description: 'interaction' })
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiQuery({ name: 'intent', type: String, required: false, description: 'Intent' })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    rasaIntents(
        @Param('interactionId') interactionId: string,
        @Param('botId') botId: string,
        @Query('language') language: string,
        @Query('intent') intent: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getInteractionByContextAndContainIntent(
            botId,
            interactionId,
            intent,
            language,
            castStringToBoolean(published),
        );
    }

    @Get('/engine/bot/:botId/config')
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    getBotConfig(@Param('botId') botId: string) {
        return this.engineService.getInfoBotsConfig(null, botId);
    }

    @Get('/engine/workspace/:workspaceId/bot/:botId/config')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    getWorkspaceAndBotConfig(@Param('workspaceId') workspaceId: string, @Param('botId') botId: string) {
        return this.engineService.getInfoBotsConfig(workspaceId, botId);
    }

    @Get('/engine/:workspaceId/:botId/interactions')
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiQuery({
        name: 'interactionIds',
        type: String,
        required: false,
        description:
            'Separated by commas eg:. interactionIds: "5bab8c9244dce91e7f921fb6, 5bab8c9244dce91e7f921fb7, 5bab8c9244dce91e7f921fb9"',
    })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    interactionByIds(
        @Query('interactionIds') interactionIds: any,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getInteractionsByIds(interactionIds, language, castStringToBoolean(published));
    }

    @Get('/engine/:workspaceId/:botId/interaction')
    @ApiQuery({ name: 'language', type: String, required: false, description: 'Language' })
    @ApiQuery({ name: 'type', type: String, required: false })
    @ApiQuery({ name: 'name', type: String, required: false })
    @ApiQuery({ name: 'children', type: String, required: false }) // @TODO: como isso vai funcionar ?
    @ApiQuery({ name: 'interactionId', type: String, required: false })
    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'botId', type: String })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    interactionFilters(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Query() params: any,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.filterInteractionsByArgs(
            workspaceId,
            botId,
            { ...params },
            language,
            castStringToBoolean(published),
        );
    }

    @Get('/engine/:workspaceId/:botId/interactions/triggers/:trigger')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'trigger', description: 'trigger id', type: String, required: true })
    @ApiParam({ name: 'language', description: 'language', type: String, required: true })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    interactionTrigger(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Param('trigger') triggerId: string,
        @Query('language') language: string,
        @Query('published') published: string,
        @Query('currentInteractionId') currentInteractionId: string,
    ) {
        return this.engineService.getInteractionByTriggerAndBotId(
            workspaceId,
            botId,
            triggerId,
            language,
            currentInteractionId,
            castStringToBoolean(published),
        );
    }

    @Get('/engine/:workspaceId/:botId/interactions/:interactionId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'language', description: 'language', type: String, required: false })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    @ApiQuery({ name: 'published', type: String, required: false, description: 'Published' })
    interactionById(
        @Param('interactionId') interactionId: string,
        @Query('language') language: string,
        @Query('published') published: string,
    ) {
        return this.engineService.getInteractionById(interactionId, language, castStringToBoolean(published));
    }

    @Post('/engine/:workspaceId/entities')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    async getEntryAttributes(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: EntityQueryDto,
    ) {
        return await this.engineService.getEntry(workspaceId, body.entityName, body.entryName);
    }

    @Get('/engine/:workspaceId/entities/:entityName')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'entityName', description: 'entity name', type: String, required: true })
    async getEntity(@Param('workspaceId') workspaceId: string, @Param('entityName') entityName: string) {
        return await this.engineService.getEntity(workspaceId, entityName);
    }

    @Post('/engine/workspace/:workspaceId/set-accepted-privacy-policy')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async setAcceptedLGPD(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: SetAcceptedPrivacyPolicyDto,
    ) {
        return await this.engineService.setAcceptedPrivacyPolicy(workspaceId, body);
    }

    @Post('/engine/workspace/:workspaceId/get-accepted-privacy-policy')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getAcceptedLGPDByPhone(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: GetAcceptedPrivacyPolicyDto,
    ) {
        return await this.engineService.getAcceptedPrivacyPolicyByPhone(workspaceId, body);
    }

    @Get('/engine/workspace/:workspaceId/privacy-policy')
    @ApiQuery({ name: 'channelConfigToken', description: 'channelConfigToken', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getPrivacyPolicyByChannelConfigToken(
        @Query('channelConfigToken') channelConfigToken: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.engineService.getPrivacyPolicyByChannelConfigIdOrChannelConfigToken(
            workspaceId,
            channelConfigToken,
        );
    }

    @Post('/engine/workspace/:workspaceId/message-by-scheduleId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getMessageByScheduleId(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: GetMessageByScheduleDto,
    ) {
        return this.engineService.getMessageByScheduleId(workspaceId, body.scheduleId);
    }

    @Post('/engine/workspace/:workspaceId/cancel-reason')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getCancelReasonByIds(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: ReasonIdsQueryDto,
    ) {
        return await this.engineService.getCancelReasonByIds(workspaceId, body.reasonIds);
    }

    @Post('/engine/workspace/:workspaceId/audio-transcription')
    @UseGuards(BotAudioTranscriptionFeatureFlagGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getAudioTranscriptionByActivityId(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: AudioTranscriptionQueryDto,
    ) {
        return await this.engineService.getAudioTranscriptionByActivityId(workspaceId, body.activityId, body.createdBy);
    }

    @Post('/engine/workspace/:workspaceId/schedules-by-groupId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async getSchedulesByGroupId(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: GetSchedulesByGroupIdDto,
    ) {
        return await this.engineService.getSchedulesByGroupId(workspaceId, body.groupId);
    }
}
