import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../../config/config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CoreWorkspaceController } from './controllers/core-workspace.controller';
import { CoreWorkspace } from './models/core-workspace.entity';
import { CountryState } from './models/country-state.entity';
import { CustomerErp } from './models/customer-erp.entity';
import { CustomerStep } from './models/customer-step.entity';
import { Functionality } from './models/functionality.entity';
import { IntegrationProvider } from './models/integration-provider.entity';
import { InternalEmployee } from './models/internal-employee.entity';
import { Segment } from './models/segment.entity';
import { Teams } from './models/teams.entity';
import { Templates } from './models/templates.entity';
import { Users } from './models/users.entity';
import { CORE_CONNECTION } from './ormconfig';
import { CoreWorkspaceService } from './services/core-workspace.service';
import { CountryStateService } from './services/country-state.service';
import { CustomerErpService } from './services/customer-erp.service';
import { CustomerStepService } from './services/customer-step.service';
import { FunctionalityService } from './services/functionality.service';
import { IntegrationProviderService } from './services/integration-provider.service';
import { InternalEmployeeService } from './services/internal-employee.service';
import { SegmentService } from './services/segment.service';
import { MongoToPostgresSyncService } from './services/mongo-to-postgres-sync.service';
import { CacheModule } from '../_core/cache/cache.module';
import { synchronizePostgres } from '../../common/utils/sync';
import { CoreHealthCheckService } from './services/core-health-check.service';
import { UserSchema } from '../users/schemas/user.schema';
import { TeamSchema } from '../team/schemas/team.schema';
import { TemplateMessageSchema } from '../template-message/schema/template-message.schema';
@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CORE_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'core',
        }),
        TypeOrmModule.forFeature(
            [
                CoreWorkspace,
                CountryState,
                CustomerErp,
                CustomerStep,
                IntegrationProvider,
                InternalEmployee,
                Segment,
                Functionality,
                Teams,
                Templates,
                Users,
            ],
            CORE_CONNECTION,
        ),
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: 'Team', schema: TeamSchema },
            { name: 'TemplateMessage', schema: TemplateMessageSchema },
        ]),
        CacheModule,
    ],
    providers: [
        CoreWorkspaceService,
        CustomerErpService,
        CountryStateService,
        CustomerStepService,
        IntegrationProviderService,
        InternalEmployeeService,
        SegmentService,
        FunctionalityService,
        CoreHealthCheckService,
        MongoToPostgresSyncService,
    ],
    exports: [],
    controllers: [CoreWorkspaceController],
})
export class CoreModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(CoreWorkspaceController);
    }
}
