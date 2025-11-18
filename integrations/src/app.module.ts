import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import appConfig from './app.config';
import databaseConfig from './database.config';
import { StatusModule } from './status/status.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PromMetricsController } from './prom-metrics.controller';
import { SapModule } from './sap-integration/sap.module';
import { PrivateModule } from './health/private/private.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../.env', '.env'],
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        autoIndex: false,
        retryAttempts: 10,
        useNewUrlParser: true,
        minPoolSize: 5,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    HealthModule,
    StatusModule,
    SapModule,
    PrivateModule,
  ],
  controllers: [PromMetricsController],
})
export class AppModule {}
