import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CampaignController } from './controllers/campaign-controller';
import { CampaignService } from './services/campaign.service';
import { CAMPAIGN_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { Campaign } from '../campaign/models/campaign.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalDataService } from './services/external-data.service';
import { ContactService } from './services/contact.service';
import { CampaignContactService } from './services/campaign-contact.service';
import { Contact } from '../campaign/models/contact.entity';
import { CampaignContact } from '../campaign/models/campaign-contact.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContactAttributeService } from './services/contact-attribute.service';
import { ContactAttribute } from '../campaign/models/contact-attribute.entity';
import { CacheModule } from '../_core/cache/cache.module';
import { CampaignAttributeService } from './services/campaign-attribute.service';
import { CampaignAttribute } from '../campaign/models/campaign-attributes.entity';
import { CampaignMessageStatusConsumerService } from './services/message-status-consumer.service';
import { AgentStatusMiddleware } from '../agent-status/middleware/agent-status.middleware';

@Module({
    providers: [
        CampaignService,
        CampaignAttributeService,
        ExternalDataService,
        ContactService,
        CampaignContactService,
        ContactAttributeService,
        CampaignMessageStatusConsumerService,
    ],
    controllers: [CampaignController],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CAMPAIGN_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'campaign',
        }),
        TypeOrmModule.forFeature(
            [Campaign, CampaignAttribute, CampaignContact, Contact, ContactAttribute],
            CAMPAIGN_CONNECTION,
        ),
        WorkspacesModule,
        CacheModule,
    ],
    exports: [],
})
export class CampaignModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware, AgentStatusMiddleware).forRoutes(CampaignController);
    }
}