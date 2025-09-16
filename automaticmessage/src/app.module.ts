import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BDScheduleModule } from './schedule/schedule.module';
import { KafkaModule } from './kafka/kafka.module';
import { ConfigModule } from '@nestjs/config';
import { AmqpModule } from './amqp/amqp.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AmqpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: [
        '../.env',
        '../../.env',
      ]
    }),
    BDScheduleModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
