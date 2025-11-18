import { Module } from '@nestjs/common';
import { ExternalInsurancesModule } from './external-insurances/external-insurances.module';
import { IntegrationModule } from './integration/integration.module';
import { IntegratorModule } from './integrator/integrator.module';
import { EntitiesModule } from './entities/entities.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ANALYTICS_CONNECTION_NAME,
  ANALYTICS_ORM_CONFIG,
  INTEGRATIONS_CONNECTION_NAME,
  INTEGRATIONS_ORM_CONFIG,
} from './ormconfig';
import postgresConfig from './postgres.config';
import { SchedulesModule } from './schedules/schedules.module';
import { PatientAcceptanceModule } from './patient-acceptance/patient-acceptance.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { RabbitModule } from '../common/rabbit-module/rabbit.module';
import { ScheduleNotificationModule } from './schedule-notification/schedule-notification.module';
import { TokenManagementModule } from './token-management/token-management.module';
import { ReportProcessorModule } from './report-processor/report-processor.module';
import { EntitiesEmbeddingModule } from './entities-embedding/entities-embedding.module';
import { DataSource } from 'typeorm';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forFeature(postgresConfig),
    TypeOrmModule.forRootAsync({
      name: INTEGRATIONS_CONNECTION_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...INTEGRATIONS_ORM_CONFIG,
        url: configService.get<string>('postgres.url'),
        extra: {
          min: 3,
          max: 20,
          connectionTimeoutMillis: 5_000,
          idleTimeoutMillis: 10_000,
        },
      }),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        // @ts-ignore TypeORM does not support but the database supports
        dataSource.driver.supportedDataTypes.push('vector');
        await dataSource.initialize();
        return dataSource;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: ANALYTICS_CONNECTION_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...ANALYTICS_ORM_CONFIG,
        url: configService.get<string>('postgres.urlRead'),
        extra: {
          min: 3,
          max: 10,
          connectionTimeoutMillis: 5_000,
          idleTimeoutMillis: 10_000,
        },
      }),
      inject: [ConfigService],
    }),
    RabbitModule,
    IntegrationModule,
    IntegratorModule,
    EntitiesModule,
    ExternalInsurancesModule,
    AnalyticsModule,
    SchedulesModule,
    PatientAcceptanceModule,
    SchedulingModule,
    ScheduleNotificationModule,
    TokenManagementModule,
    ReportProcessorModule,
    EntitiesEmbeddingModule,
    DocumentsModule,
  ],
})
export class HealthModule {}
