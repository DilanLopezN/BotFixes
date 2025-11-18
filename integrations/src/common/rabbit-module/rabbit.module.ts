import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuditConsumerService } from '../../health/audit/services/audit-consumer.service';
import { shouldStartRabbit } from '../bootstrap-options';
import { BotdesignerService } from '../../health/integrations/botdesigner-integration/services/botdesigner.service';

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
      connectionManagerOptions: {
        heartbeatIntervalInSeconds: 0,
      },
      registerHandlers: shouldStartRabbit(),
      channels: {
        [AuditConsumerService.name]: {
          prefetchCount: 1,
        },
        [BotdesignerService.name]: {
          prefetchCount: 1,
        },
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitModule {}
