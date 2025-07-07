import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './modules/analytics.module';
import { AnalyticsService } from './modules/analytics/conversation-analytics/services/analytics.service';
import { FallbackConsumerService } from './modules/analytics/fallback/services/fallback-consumer.service';
import { HealthAnalyticsConsumerService } from './modules/analytics/health-analytics/services/health-analytics-consumer.service';
import { ConversationSearchConsumerService } from './modules/analytics/conversation-search/services/conversation-search.consumer.service';
import { PromMetricsController } from './prom-metrics.controller';
import { ContactSearchConsumerService } from './modules/analytics/contact-search/services/contact-search-consumer.service';
import { FlowConsumerService } from './modules/analytics/conversation-flow/services/flow-consumer.service';
import { ScheduleModule } from '@nestjs/schedule';

const envs = [
  __dirname + '/../.env',
  __dirname + '/../../.env',
  __dirname + '/../../../.env',
]
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: envs,
      isGlobal: true,
      load: [],
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: process.env.EVENT_EXCHANGE_NAME,
          type: 'topic',
        },
      ],

      // uri: 'amqps://asyxhxgc:6VISTWeoLxtvd6G_mdHdclzVLegbFlrS@crisp-gray-swallow.rmq4.cloudamqp.com/developer',//process.env.AMQP_SERVER_URI,
      uri: process.env.AMQP_SERVER_URI,
      connectionInitOptions: { wait: false },
      channels: {
        [AnalyticsService.name + '_ACTIVITY']: {
          prefetchCount: 2,
        },
        [AnalyticsService.name + '_CONVERSATION']: {
          prefetchCount: 1,
        },
        [FallbackConsumerService.name]: {
          prefetchCount: 1,
        },
        [HealthAnalyticsConsumerService.name]: {
          prefetchCount: 1,
        },
        [ConversationSearchConsumerService.name]: {
          prefetchCount: 1,
        },
        [ContactSearchConsumerService.name]: {
          prefetchCount: 1,
        },
        [FlowConsumerService.name]: {
          prefetchCount: 10,
        }
      },
    }),
    AnalyticsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, PromMetricsController],
  providers: [AppService],
})
export class AppModule {}
