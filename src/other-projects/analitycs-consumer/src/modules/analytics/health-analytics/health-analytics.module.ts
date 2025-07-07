import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthAnalyticsService } from './services/health-analytics.service';
import { HealthAnalyticsConsumerService } from './services/health-analytics-consumer.service';
import { HealthAnalyticsProcessorService } from './services/health-analytics-processor.service';
import { ANALYTICS_CONNECTION } from '../consts';
import { Appointment } from 'kissbot-entities';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment], ANALYTICS_CONNECTION)],
  controllers: [],
  providers: [
    HealthAnalyticsService,
    HealthAnalyticsConsumerService,
    HealthAnalyticsProcessorService,
  ],
})
export class HealthAnalyticsModule {}
