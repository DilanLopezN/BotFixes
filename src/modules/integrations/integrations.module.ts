import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEntitySchema } from './schemas/health/health-entity.schema';
import { HealthEntityService } from './services/health/health-entity.service';
import { HealthController } from './controllers/health/health.controller';
import { HealthIntegrationSchema } from './schemas/health/health-integration.schema';
import { HealthIntegrationService } from './services/health/health-integration.service';
import { HealthFlowService } from './services/health/health-flow.service';
import { HealthFlowSchema } from './schemas/health/health-flow.schema';
import { TasksService } from './services/health/cron';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthFlowController } from './controllers/health/health-flow.controller';
import { HealthEntityController } from './controllers/health/health-entity.controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EventsModule } from '../events/events.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '../_core/cache/cache.module';
import { FlowHistorySchema } from './schemas/health/health-flow-history.schema';
import { FlowPublicationHistoryModule } from '../flow-publication-history/flow-publication-history.module';
import { FlowHistoryService } from './services/health/flow-history.service';
import { HealthIntegrationStatusService } from './services/health/health-integration.status.service';
import { ExternalDataService } from './services/health/external-data.service';
import { HealthPedingPublicationController } from './controllers/health/health-pending-publication.controller';
import { HealthIntegrationStatusController } from './controllers/health/health-integration-status.controller';
import { HealthIntegrationMessagesService } from './services/health/health-integration-messages.service';
import { HealthIntegrationMessagesSchema } from './schemas/health/health-integration-messages.schema';
import { HealthIntegrationMessagesController } from './controllers/health/health-integration-messages.controller';
import { HealthDocumentsController } from './controllers/health/health-documents.controller';
import { HealthDocumentsService } from './services/health/health-documents.service';
import { QueryExecutorController } from './controllers/health/query-executor.controller';
import { QueryExecutorService } from './services/health/query-executor.service';

@Module({
    controllers: [
        HealthController,
        HealthFlowController,
        HealthEntityController,
        HealthPedingPublicationController,
        HealthIntegrationStatusController,
        HealthIntegrationMessagesController,
        HealthDocumentsController,
        QueryExecutorController,
    ],
    imports: [
        MongooseModule.forFeature([
            { name: 'HealthEntity', schema: HealthEntitySchema },
            { name: 'HealthIntegration', schema: HealthIntegrationSchema },
            { name: 'HealthFlow', schema: HealthFlowSchema },
            { name: 'FlowHistory', schema: FlowHistorySchema },
            { name: 'HealthIntegrationMessages', schema: HealthIntegrationMessagesSchema },
        ]),
        HttpModule.register({
            timeout: 30000,
            baseURL: process.env.INTEGRATIONS_URI,
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`,
            },
        }),
        ScheduleModule.forRoot(),
        EventsModule,
        CacheModule,
        FlowPublicationHistoryModule,
    ],
    providers: [
        HealthEntityService,
        HealthIntegrationService,
        HealthFlowService,
        TasksService,
        FlowHistoryService,
        HealthIntegrationMessagesService,
        HealthIntegrationStatusService,
        ExternalDataService,
        HealthDocumentsService,
        QueryExecutorService,
    ],
})
export class IntegrationsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                HealthController,
                HealthFlowController,
                HealthEntityController,
                FlowHistoryService,
                HealthPedingPublicationController,
                HealthIntegrationStatusController,
                HealthIntegrationMessagesController,
                HealthDocumentsController,
                QueryExecutorController,
            );
    }
}
