import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './../../config/config.module';
import { SetupSettingService } from './services/setup-setting.service';
import { SetupBillingService } from './services/setup-billing.service';
import { SetupWorkspaceService } from './services/setup-workspace.service';
import { SetupService } from './services/setup.service';
import { SetupController } from './controllers/setup.controller';
import { SetupSetting } from './models/setup-setting.entity';
import { STARTER_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { SetupHealthCheckService } from './services/setup-health-check.service';
@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: STARTER_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: STARTER_CONNECTION,
        }),
        TypeOrmModule.forFeature([SetupSetting], STARTER_CONNECTION),
    ],
    controllers: [SetupController],
    providers: [SetupService, SetupBillingService, SetupWorkspaceService, SetupSettingService, SetupHealthCheckService],
})
export class SetupModule {}
