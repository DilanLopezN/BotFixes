import { Module } from '@nestjs/common';
import { CacheModule } from '../../core/cache/cache.module';
import { IntegrationCacheUtilsModule } from '../integration-cache-utils/integration-cache-utils.module';
import { RulesHandlerService } from './rules-handler.service';

@Module({
  imports: [CacheModule, IntegrationCacheUtilsModule],
  providers: [RulesHandlerService],
  exports: [RulesHandlerService],
})
export class RulesHandlerModule {}
