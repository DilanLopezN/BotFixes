import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EventsModule } from '../events/events.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CacheModule } from '../_core/cache/cache.module';
import { CampaignActionController } from './controllers/campaign-action.controller';
import { CampaignController } from './controllers/campaign-controller';
import { CampaignAction } from './models/campaign-action.entity';
import { CampaignAttribute } from './models/campaign-attributes.entity';
import { CampaignContact } from './models/campaign-contact.entity';
import { Campaign } from './models/campaign.entity';
import { ContactAttribute } from './models/contact-attribute.entity';
import { Contact } from './models/contact.entity';
import { CAMPAIGN_CONNECTION } from './ormconfig';
import { CampaignActionService } from './services/campaign-action.service';
import { CampaignAttributeService } from './services/campaign-attribute.service';
import { CampaignContactService } from './services/campaign-contact.service';
import { CampaignService } from './services/campaign.service';
import { ContactAttributeService } from './services/contact-attribute.service';
import { ContactService } from './services/contact.service';
import { ExternalDataService } from './services/external-data.service';
import { CampaignStatusChangedConsumerService } from './services/status-changed-consumer.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { CampaignHealthCheckService } from './services/campaign-health-check.service';
import { CampaignConsumerService } from './services/campaign-consumer';

@Module({
    providers: [
        CampaignActionService,
        CampaignAttributeService,
        CampaignContactService,
        CampaignService,
        ContactAttributeService,
        ContactService,
        ExternalDataService,
        CampaignStatusChangedConsumerService,
        CampaignHealthCheckService,
        CampaignConsumerService,
    ],
    controllers: [CampaignController, CampaignActionController],
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
            [Campaign, CampaignAction, CampaignAttribute, CampaignContact, Contact, ContactAttribute],
            CAMPAIGN_CONNECTION,
        ),
        EventsModule,
        WorkspacesModule,
        CacheModule,
    ],
})
export class CampaignModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(CampaignController, CampaignActionController);
    }
}
