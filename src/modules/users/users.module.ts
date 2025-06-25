import { AuthModule } from './../auth/auth.module';
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CacheModule } from '../_core/cache/cache.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { EventsModule } from './../events/events.module';
import { StorageModule } from '../storage/storage.module';
import { UserHistorySchema } from './schemas/user-history.schema';
import { UsersHistoryService } from './services/users-history.service';
import { CognitoIdentityService } from './services/cognito-identity.service';
import { BillingModule } from '../billing/billing.module';
import { PasswordResetRequestService } from './services/password-reset-request.service';
import { ExternalDataService } from './services/external-data.service';
import { ConfigService } from '../../config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { synchronizePostgres } from '../../common/utils/sync';
import { USER_CONNECTION } from './ormconfig';
import { VerifyEmailRequestService } from './services/verify-email-request.service';
import { VerifyEmailRequest } from './models/verify-email-request.entity';
import { PasswordResetController } from './controllers/password-reset.controller';

import { MailResetRequestService } from './services/mail-reset-request.service';
import { MailResetController } from './controllers/mail-reset.controller';

import { PasswordResetRequest } from './models/password-reset-request.entity';

@Module({
    controllers: [UsersController, PasswordResetController, MailResetController],
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: 'UserHistory', schema: UserHistorySchema },
        ]),
        CacheModule,
        forwardRef(() => AuthModule),
        EventsModule,
        WorkspacesModule,
        StorageModule,
        forwardRef(() => BillingModule),
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: USER_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'user',
        }),
        TypeOrmModule.forFeature([PasswordResetRequest, VerifyEmailRequest], USER_CONNECTION),
    ],
    providers: [
        UsersService,
        UsersHistoryService,
        CognitoIdentityService,
        ConfigService,
        PasswordResetRequestService,
        MailResetRequestService,
        ExternalDataService,
        VerifyEmailRequestService,
    ],
    exports: [UsersService, UsersHistoryService, CognitoIdentityService],
})
export class UsersModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(UsersController, PasswordResetController, MailResetController);
    }
}
