import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RUNNER_MANAGER_CONNECTION_NAME } from './connName';
import { ServiceStatus } from './models/service-status.entity';
import { RunnerManagerController } from './controllers/runner-manager.controller';
import { ServiceStatusService } from './services/service-status.service';
import { RunnerManagerAuthMiddleware } from './middlewares/runner-manager-auth.middleware';
import { Runner } from './models/runner.entity';
import { Service } from './models/service.entity';
import { Deploy } from './models/deploy.entity';
import { RunnerService } from './services/runner.service';
import { ServiceRunnerService } from './services/service-runner.service';
import { DeployService } from './services/deploy.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { RunnerController } from './controllers/runner.controller';
import { ExternalDataService } from './services/external-data.service';
import { RunnerManagerStatusService } from './services/runner-manager-status.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { RunnerHealthCheckService } from './services/runner-health-check.service';
import { CacheModule } from '../_core/cache/cache.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: RUNNER_MANAGER_CONNECTION_NAME,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres || true,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'runner_manager',
        }),
        TypeOrmModule.forFeature([ServiceStatus, Runner, Service, Deploy], RUNNER_MANAGER_CONNECTION_NAME),
        HttpModule.register({
            timeout: 30000,
            baseURL: process.env.INTEGRATIONS_URI,
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`,
            },
        }),
        CacheModule,
    ],
    controllers: [RunnerManagerController, RunnerController],
    providers: [
        ServiceStatusService,
        RunnerService,
        ServiceRunnerService,
        DeployService,
        ExternalDataService,
        RunnerManagerStatusService,
        RunnerHealthCheckService,
    ],
})
export class RunnerManagerModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RunnerManagerAuthMiddleware).forRoutes(RunnerManagerController);
        consumer.apply(AuthMiddleware).forRoutes(RunnerController);
    }
}
