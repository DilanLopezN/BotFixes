import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../../../config/config.module';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ActivitySearch } from './activity-search.entity';
import { ActivitySearchService } from './activity-search.service';
import { ActivitySearchV2Service } from './activity-search-v2.service';
import { CacheModule } from '../../../_core/cache/cache.module';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([ActivitySearch], ANALYTICS_READ_CONNECTION), CacheModule],
    providers: [ActivitySearchService, ActivitySearchV2Service],
    exports: [ActivitySearchService, ActivitySearchV2Service],
})
export class ActivitySearchModule {}
