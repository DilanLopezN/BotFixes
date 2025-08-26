import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ActiveMessageResponseConsumerService } from '../../active-message/services/active-message-response-consumer.service';
import { ConversationInvalidNumberConsumerService } from '../../active-message/services/conversation-invalid-number-consumer.service';
import { IncomingApiConsumerService } from '../../active-message/services/incoming-api-consumer.service';
import { ActivityV2AckService } from '../../activity-v2/services/activity-v2-ack.service';
import { AckConsumerRedisService } from '../../activity/services/ack-consumer-redis.service';
import { CampaignStatusChangedConsumerService } from '../../campaign/services/status-changed-consumer.service';
import { EventsChannelLiveAgentService } from '../../channel-live-agent/services/events-channel-live-agent.service';
import { ChannelTelegramConsumerService } from '../../channels/channel-telegram/services/channel-telegram-consumer.service';
import { FacebookOutcomingConsumerService } from '../../channels/facebook/services/facebook-outcoming.service';
import { CheckPhoneNumberService } from '../../channels/gupshup/services/check-phone-number.service';
import { GupshupChannelConsumer } from '../../channels/gupshup/services/gupshup-channel-consumer.service';
import { GupshupIncomingAckConsumer } from '../../channels/gupshup/services/gupshup-incoming-ack-consumer.service';
import { GupshupIncomingMessageConsumer } from '../../channels/gupshup/services/gupshup-incoming-message-consumer.service';
import { WebchatChannelConsumerService } from '../../channels/webchat/services/webchat-channel-consumer.service';
import { ContactQueueConsumerService } from '../../contact/services/contact-queue-consumer.service';
import { AssignRequestConsumerService } from '../../conversation/services/assign-request-consumer.service';
import { ConversationCallbackService } from '../../conversation/services/conversation-callback.service';
import { ConversationContactConsumerService } from '../../conversation/services/conversation-contact-consumer.service';
import { TagConsumerService } from '../../conversation/services/tag-consumer.service';
import { RatingChannelConsumerService } from '../../rating/services/rating-channel-consumer.service';
import { shouldStartRabbit } from '../../../common/utils/bootstrapOptions';
import { MetricsCustomerXConsumerService } from '../../customer-x/services/metrics-consumer.service';
import { CampaignMessageStatusConsumerService } from '../../campaign-v2/services/message-status-consumer.service';
import { ConversationClosedConsumerService } from '../../conversation-smt-re/services/conversation-closed-consumer.service';
import { ConversationAutomaticDistributionService } from '../../conversation-automatic-distribution/services/conversation-automatic-distribution.service';
import { AgentStatusConsumerService } from '../../agent-status/services/agent-status-consumer.service';

@Module({
    imports: [
        RabbitMQModule.forRoot(RabbitMQModule, {
            exchanges: [
                {
                    name: process.env.EVENT_EXCHANGE_NAME,
                    type: 'topic',
                },
                {
                    name: process.env.CHANNEL_EXCHANGE_NAME,
                    type: 'topic',
                },
            ],
            uri: process.env.AMQP_SERVER_URI,
            connectionInitOptions: { wait: false },
            registerHandlers: shouldStartRabbit(),
            connectionManagerOptions: {
                heartbeatIntervalInSeconds: '0' as any, // Aparentemente a lib é bugada, se passa 0 numérico ela seta pra 5 que é o default
            },
            channels: {
                // chanels consumers
                [GupshupChannelConsumer.name]: {
                    prefetchCount: 60,
                },
                [ChannelTelegramConsumerService.name]: {
                    prefetchCount: 0,
                },
                [FacebookOutcomingConsumerService.name]: {
                    prefetchCount: 0,
                },
                [WebchatChannelConsumerService.name]: {
                    prefetchCount: 0,
                },
                [RatingChannelConsumerService.name]: {
                    prefetchCount: 0,
                },
                [GupshupIncomingAckConsumer.name]: {
                    prefetchCount: 30,
                },
                [GupshupIncomingMessageConsumer.name]: {
                    prefetchCount: 20,
                },
                [CheckPhoneNumberService.name]: {
                    prefetchCount: 0,
                },
                [ActiveMessageResponseConsumerService.name]: {
                    prefetchCount: 0,
                },
                [IncomingApiConsumerService.name]: {
                    prefetchCount: 0,
                },
                [AckConsumerRedisService.name]: {
                    prefetchCount: 2,
                },
                [ActivityV2AckService.name]: {
                    prefetchCount: 5,
                },
                [EventsChannelLiveAgentService.name]: {
                    prefetchCount: 10,
                },
                [ContactQueueConsumerService.name]: {
                    prefetchCount: 10,
                },
                [AssignRequestConsumerService.name]: {
                    prefetchCount: 1,
                },
                // [ConversationAttributeConsumerService.name]: {
                //     prefetchCount: 1,
                // },
                [ConversationCallbackService.name]: {
                    prefetchCount: 0,
                },
                [TagConsumerService.name]: {
                    prefetchCount: 1,
                },
                [ConversationContactConsumerService.name]: {
                    prefetchCount: 1,
                },
                [ConversationInvalidNumberConsumerService.name]: {
                    prefetchCount: 1,
                },
                [CampaignStatusChangedConsumerService.name]: {
                    prefetchCount: 1,
                },
                [MetricsCustomerXConsumerService.name]: {
                    prefetchCount: 10,
                },
                [CampaignMessageStatusConsumerService.name]: {
                    prefetchCount: 10,
                },
                [ConversationClosedConsumerService.name]: {
                    prefetchCount: 10,
                },
                [ConversationAutomaticDistributionService.name]: {
                    prefetchCount: 10,
                },
                [AgentStatusConsumerService.name]: {
                    prefetchCount: 10,
                },
            },
        }),
    ],
    exports: [RabbitMQModule],
})
export class Amqpv2Module {}
