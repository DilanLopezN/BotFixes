import { Module } from '@nestjs/common';
import { CacheModule } from '../../core/cache/cache.module';
import { IntegrationCacheUtilsService } from '../integration-cache-utils/integration-cache-utils.service';

@Module({
  imports: [CacheModule],
  providers: [IntegrationCacheUtilsService],
  exports: [IntegrationCacheUtilsService],
})
export class IntegrationCacheUtilsModule {}
