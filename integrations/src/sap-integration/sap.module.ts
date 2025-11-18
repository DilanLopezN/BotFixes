import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SapService } from './services/sap.service';
import { SapCronService } from './services/sap-cron.service';
import { SapApiService } from './services/sap-api.service';
import { SapController } from './sap.controller';
import { SapCacheService } from './services/sap-cache.service';
import { CacheModule } from 'core/cache/cache.module';
import { AuditModule } from 'health/audit/audit.module';
import { SapDynamoDB } from './services/sap-dynamodb.service';
import { ApiModule } from '../health/api/api.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150_000,
    }),
    CacheModule,
    AuditModule,
    ApiModule,
  ],
  providers: [SapService, SapCronService, SapApiService, SapCacheService, SapDynamoDB],
  controllers: [SapController],
})
export class SapModule {}
