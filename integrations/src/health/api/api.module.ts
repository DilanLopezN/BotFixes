import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import apiConfig from './api.config';
import { ApiService } from './services/api.service';
import { AuditModule } from '../audit/audit.module';
import { ApiQueueService } from './services/api-queue.service';
import { IntegrationCacheUtilsModule } from 'health/integration-cache-utils/integration-cache-utils.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    ConfigModule.forFeature(apiConfig),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: 30_000,
        baseURL: configService.get<string>('health-api.url'),
        headers: {
          Authorization: `Bearer ${configService.get<string>('health-api.token')}`,
        },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
    IntegrationCacheUtilsModule,
    IntegrationModule,
  ],
  providers: [ApiService, ApiQueueService],
  exports: [ApiService, ApiQueueService],
})
export class ApiModule {}
