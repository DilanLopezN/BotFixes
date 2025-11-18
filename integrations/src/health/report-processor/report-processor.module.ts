import { forwardRef, Module } from '@nestjs/common';
import { ReportProcessorController } from './report-processor.controller';
import { ReportProcessorService } from './services/report-processor.service';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';
import { IntegrationModule } from '../integration/integration.module';
import { IntegratorModule } from '../integrator/integrator.module';
import { EntitiesModule } from '../entities/entities.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportProcessorAnalytics } from './entities/report-processor-analytics.entity';
import { ReportProcessorAnalyticsService } from './services/report-processor-analytics.service';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { EntitiesEmbeddingModule } from 'health/entities-embedding/entities-embedding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportProcessorAnalytics], INTEGRATIONS_CONNECTION_NAME),
    AuditModule,
    AiModule,
    IntegrationModule,
    forwardRef(() => IntegratorModule),
    forwardRef(() => EntitiesModule),
    EntitiesEmbeddingModule,
  ],
  controllers: [ReportProcessorController],
  providers: [ReportProcessorService, ReportProcessorAnalyticsService],
  exports: [ReportProcessorService, ReportProcessorAnalyticsService],
})
export class ReportProcessorModule {}
