import { Module } from '@nestjs/common';
import { VapiIntegrationController } from './controller/vapi-integration.controller';
import { VapiIntegrationService } from './services/vapi-integration.service';
import { VapiIntegrationCronService } from './services/vapi-integration-cron.service';
import { IntegratorModule } from '../integrator/integrator.module';
import { IntegrationModule } from '../integration/integration.module';
import { ApiModule } from '../api/api.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 10_000,
        limit: 500,
      },
    ]),
    IntegratorModule,
    IntegrationModule,
    ApiModule,
    CacheModule,
  ],
  controllers: [VapiIntegrationController],
  providers: [VapiIntegrationService, VapiIntegrationCronService],
  exports: [VapiIntegrationService],
})
export class VapiIntegrationModule {}
