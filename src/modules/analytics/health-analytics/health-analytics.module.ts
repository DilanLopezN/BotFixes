import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { EventsModule } from '../../events/events.module';
import { HealthAnalyticsController } from './health-analytics.controller';
import { HealthAnalyticsService } from './services/health-analytics.service';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../ormconfig';
import { Appointment } from 'kissbot-entities';
@Module({
    imports: [
        EventsModule,
        TypeOrmModule.forFeature([Appointment], ANALYTICS_CONNECTION),
        TypeOrmModule.forFeature([Appointment], ANALYTICS_READ_CONNECTION),
    ],
    controllers: [HealthAnalyticsController],
    providers: [HealthAnalyticsService],
})
export class HealthAnalyticsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(HealthAnalyticsController);
    }
}
