import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceUserModule } from '../../workspace-user/workspace-user.module';
import { AuthMiddleware } from './../../auth/middleware/auth.middleware';
import { INTERNAL_ANALYTICS_CONNECTION } from './conn';
import { InternalAnalyticsController } from './internal-analytics.controller';
import { InternalAnalyticsService } from './internal-analytics.service';
import { CustomerResume } from 'kissbot-entities';
import { synchronizePostgres } from '../../../common/utils/sync';
import { InternalAnalyticsHealthCheckService } from './internal-analytics-health-check.service';
@Module({
    providers: [InternalAnalyticsService, InternalAnalyticsHealthCheckService],
    controllers: [InternalAnalyticsController],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: INTERNAL_ANALYTICS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}', CustomerResume],
            synchronize: synchronizePostgres || true,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'internal_analytics',
        }),
        TypeOrmModule.forFeature([CustomerResume], INTERNAL_ANALYTICS_CONNECTION),
        WorkspaceUserModule,
    ],
})
export class InternalAnalyticsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(InternalAnalyticsController);
    }
}
