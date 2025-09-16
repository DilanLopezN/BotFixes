import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ResendConversationClosedConsumerService } from '../schedule/services/schedule-message/resend-conversation-closed-consumer.service';
import { SchedulingConfirmationConsumerService } from '../schedule/services/schedule-message/scheduling-confirmation-consumer.service';
import { ScheduleMessageResponseConsumerService } from '../schedule/services/schedule-message/schedule-message-response-consumer.service';
import { shouldStartRabbit } from '../miscellaneous/utils';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: process.env.EVENT_EXCHANGE_NAME,
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
        [ResendConversationClosedConsumerService.name]: {
          prefetchCount: 10,
        },
        [SchedulingConfirmationConsumerService.name]: {
          prefetchCount: 10,
        },
        [ScheduleMessageResponseConsumerService.name]: {
          prefetchCount: 10,
        }
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class AmqpModule {}
