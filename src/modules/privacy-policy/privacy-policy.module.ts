import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../_core/cache/cache.module';
import { ConfigModule } from '../../config/config.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { PRIVACY_POLICY } from './ormconfig';
import { PrivacyPolicy } from './models/privacy-policy.entity';
import { PrivacyPolicyService } from './services/privacy-policy.service';
import { PrivacyPolicyController } from './controller/privacy-policy.controller';
import { ContactsAcceptedPrivacyPolicyService } from './services/contacts-accepted-privacy-policy.service';
import { ExternalDataService } from './services/external-data.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { PrivacyPolicyHealthCheckService } from './services/privacy-policy-health-check.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: PRIVACY_POLICY,
            url: process.env.POSTGRESQL_URI,
            entities: [PrivacyPolicy],
            synchronize: synchronizePostgres || true,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: PRIVACY_POLICY,
        }),
        TypeOrmModule.forFeature([PrivacyPolicy], PRIVACY_POLICY),
        CacheModule,
    ],
    providers: [
        PrivacyPolicyService,
        ContactsAcceptedPrivacyPolicyService,
        ExternalDataService,
        PrivacyPolicyHealthCheckService,
    ],
    exports: [PrivacyPolicyService, ContactsAcceptedPrivacyPolicyService],
    controllers: [PrivacyPolicyController],
})
export class PrivacyPolicyModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(PrivacyPolicyController);
    }
}
