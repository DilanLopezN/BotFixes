import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { SchedulingController } from './controller/scheduling.controller';
import { SchedulingService } from './services/scheduling.service';
import { IntegratorModule } from '../integrator/integrator.module';
import { IntegrationModule } from '../integration/integration.module';
import { SchedulingRedirectController } from './controller/scheduling-redirect.controller';
import { SchedulingDownloadController } from './controller/scheduling-download.controller';
import { SchedulingTransformerService } from './services/scheduling.transformer.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingLinks } from './entities/scheduling-links.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { SchedulingLinksService } from './services/scheduling-links.service';
import { SchedulingEventsService } from './services/scheduling-events.service';
import { SchedulingEvents } from './entities/scheduling-events.entity';
import { SchedulingDownloadReportController } from './controller/scheduling-download-report.controller';
import { SchedulingDownloadReportService } from './services/scheduling-download-report.service';
import { EventsModule } from 'health/events/events.module';
import { SchedulingEmailService } from './services/scheduling-email.service';
import { SchedulingEmailController } from './controller/scheduling-email.controller';
import { SchedulingCacheService } from './services/cache-service/scheduling-cache.service';
import { CacheModule } from 'core/cache/cache.module';
import { SchedulingListEntitiesController } from './controller/scheduling-list-entities.controller';
import { SchedulingEntitiesService } from './services/scheduling-entities.service';
import { RateLimitMiddleware } from './controller/middleware/rate-limit.middleware';
import { SchedulingAppointmentsController } from './controller/scheduling-appointments.controller';
import { SchedulingAppointmentsService } from './services/scheduling-appointments.service';
import { SchedulingDocumentsService } from './services/scheduling-documents.service';
import { SchedulingDocumentsController } from './controller/scheduling-documents.controller';
import { DocumentsModule } from '../documents/documents.module';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchedulingLinks, SchedulingEvents], INTEGRATIONS_CONNECTION_NAME),
    ThrottlerModule.forRoot([
      {
        ttl: 10_000,
        limit: 500,
      },
    ]),
    forwardRef(() => IntegratorModule),
    IntegrationModule,
    EventsModule,
    CacheModule,
    DocumentsModule,
  ],
  controllers: [
    SchedulingController,
    SchedulingRedirectController,
    SchedulingDownloadController,
    SchedulingEmailController,
    SchedulingDownloadReportController,
    SchedulingListEntitiesController,
    SchedulingAppointmentsController,
    SchedulingDocumentsController,
  ],
  providers: [
    SchedulingService,
    SchedulingTransformerService,
    SchedulingLinksService,
    SchedulingEventsService,
    SchedulingEmailService,
    SchedulingCacheService,
    SchedulingDownloadReportService,
    SchedulingEntitiesService,
    SchedulingAppointmentsService,
    SchedulingDocumentsService,
  ],
  exports: [
    SchedulingService,
    SchedulingTransformerService,
    SchedulingLinksService,
    SchedulingEventsService,
    SchedulingEmailService,
    SchedulingDownloadReportService,
    SchedulingEntitiesService,
    SchedulingAppointmentsService,
    SchedulingDocumentsService,
  ],
})
export class SchedulingModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes(SchedulingListEntitiesController, SchedulingAppointmentsController);
  }
}
