import { WorkspaceUserModule } from './modules/workspace-user/workspace-user.module';
import { ContactModule } from './modules/contact/contact.module';
import { ContactModuleV2 } from './modules/contact-v2/contact.module';
import { Module } from '@nestjs/common';
import * as multer from 'multer';
import { ConfigModule as CustomConfigModule } from './config/config.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { BotsModule } from './modules/bots/bots.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/_core/mail/mail.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EngineModule } from './modules/engine/engine.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { DialogFlowModule } from './modules/_core/dialogFlow/dialogFlow.module';
import { BotAttributesModule } from './modules/botAttributes/botAttributes.module';
import { CacheModule } from './modules/_core/cache/cache.module';
import { ChannelConfigModule } from './modules/channel-config/channel-config.module';
import { EventsModule } from './modules/events/events.module';
import { OrganizationSettingsModule } from './modules/organization-settings/organization-settings.module';
import { StatusModule } from './modules/status/status.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { AuthApiTokenModule } from './modules/auth-api-token/auth-api-token.module';
import { ChannelLiveAgentModule } from './modules/channel-live-agent/channel-live-agent.module';
import { TagsModule } from './modules/tags/tags.module';
import { ActivityModule } from './modules/activity/activity.module';
import { TemplateMessageModule } from './modules/template-message/template-message.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { TeamModule } from './modules/team/team.module';
import { WhatsappSessionControlModule } from './modules/whatsapp-session-control/whatsapp-session-control.module';
import { WorkspaceAccessGroupModule } from './modules/workspace-access-group/workspace-access-group.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { ConversationAttributeModuleV2 } from './modules/conversation-attribute-v2/conversation-attribute.module';
import { PrivateConversationDataModule } from './modules/private-conversation-data/private-conversation-data.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { FileUploaderModule } from './common/file-uploader/file-uploader.module';
import { RatingModule } from './modules/rating/rating.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { AppController } from './app.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { SetupModule } from './modules/setup/setup.module';
import { ActiveMessageModule } from './modules/active-message/active-message.module';
import { PromMetricsController } from './prom-metrics.controller';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { CoreModule } from './modules/core/core.module';
import { KafkaModule } from './modules/_core/kafka/kafka.module';
import { RunnerManagerModule } from './modules/runner-manager/runner-manager.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { PrivacyPolicyModule } from './modules/privacy-policy/privacy-policy.module';
import { IntentsModule } from './modules/intents/intents.module';
import { DeleteTeamModule } from './modules/team/deleteTeam/deleteTeam.module';
import { CloneBotModule } from './modules/bots/clone-bot/clone-bot.module';
import { GupshupModule } from './modules/channels/gupshup/gupshup.module';
import { TeamModule as TeamModuleV2 } from './modules/team-v2/team.module';
import { AtendClinicController } from './atend.clinic.controller';
import { ContextAiModule } from './modules/context-ai/context-ai.module';
import { CustomerXModule } from './modules/customer-x/customer-x.module';
import { EmailSenderModule } from './modules/email-sender/email-sender.module';
import { CampaignModule as CampaignModuleV2 } from './modules/campaign-v2/campaign.module';
import { ConversationOutcomeModule } from './modules/conversation-outcome-v2/conversation-outcome.module';
import { ConversationObjectiveModule } from './modules/conversation-objective-v2/conversation-objective.module';
import { ConversationCategorizationModule } from './modules/conversation-categorization-v2/conversation-categorization.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SuggestionTextsModule } from './modules/suggestion-texts-v2/suggestion-texts.module';
import { AgentStatusModule } from './modules/agent-status/agent-status.module';
import { ConversationSmtReModule } from './modules/conversation-smt-re/conversation-smt-re.module';
import { CheckWorkspaceDisabledGuard } from './modules/workspaces/guard/check-workspace-disabled.guard';
import { APP_GUARD } from '@nestjs/core';
import { WhatsappFlowModule } from './modules/whatsapp-flow/whatsapp-flow.module';
import { DatabaseMigrationsModule } from './modules/database-migrations/database-migrations.module';
import { ConversationAutomaticDistributionModule } from './modules/conversation-automatic-distribution/conversation-automatic-distribution.module';
import { ActiveMailMarketingModule } from './modules/active-mail-marketing/active-mail-marketing.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';

@Module({
    imports: [
        CustomConfigModule,
        MongooseModule.forRoot(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: false,
            minPoolSize: 5,
            ...(process.env.NODE_ENV === 'local'
                ? {}
                : {
                      retryWrites: true,
                      w: 'majority',
                  }),
        }),
        AnalyticsModule,
        CacheModule,
        WorkspacesModule,
        BotsModule,
        InteractionsModule,
        UsersModule,
        AuthModule,
        MailModule,
        EngineModule,
        EntitiesModule,
        DialogFlowModule,
        BotAttributesModule,
        ChannelConfigModule,
        ConversationModule,
        EventsModule,
        OrganizationSettingsModule,
        StatusModule,
        AuthApiTokenModule,
        ChannelLiveAgentModule,
        ContactModule,
        ContactModuleV2,
        WorkspaceUserModule,
        TagsModule,
        ActivityModule,
        TemplateMessageModule,
        IntegrationsModule,
        TeamModule,
        DeleteTeamModule,
        WhatsappSessionControlModule,
        WorkspaceAccessGroupModule,
        AttachmentModule,
        ConversationAttributeModuleV2,
        PrivateConversationDataModule,
        ChannelsModule,
        FileUploaderModule,
        BillingModule,
        SetupModule,
        RatingModule,
        ActiveMessageModule,
        ScheduleModule,
        CampaignModule,
        ThrottlerModule.forRoot({}),
        CoreModule,
        PrivacyPolicyModule,
        IntentsModule,
        RunnerManagerModule,
        CloneBotModule,
        GupshupModule,
        KafkaModule.forRoot({
            brokers: (process.env.KAFKA_BROKERS || '')?.split(','),
            clientId: 'API',
            connectionTimeout: 10000,
            authenticationTimeout: 10000,
            ...(process.env.NODE_ENV === 'local'
                ? {}
                : {
                      ssl: true,
                      //   sasl: {
                      //       mechanism: 'scram-sha-256',
                      //       username: process.env.KAFKA_USERNAME,
                      //       password: process.env.KAFKAPASSWORD,
                      //   },
                  }),
        }),
        TeamModuleV2,
        ContextAiModule,
        CustomerXModule,
        EmailSenderModule,
        CampaignModuleV2,
        ConversationOutcomeModule,
        ConversationObjectiveModule,
        ConversationCategorizationModule,
        ReportsModule,
        SuggestionTextsModule,
        AgentStatusModule,
        ConversationSmtReModule,
        DatabaseMigrationsModule,
        WhatsappFlowModule,
        ConversationAutomaticDistributionModule,
        ActiveMailMarketingModule,
        UserSettingsModule,
    ],
    controllers: [AppController, PromMetricsController, AtendClinicController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: CheckWorkspaceDisabledGuard,
        },
    ],
})
export class AppModule {}
