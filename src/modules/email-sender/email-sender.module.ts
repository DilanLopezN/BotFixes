import { MiddlewareConsumer, Module } from '@nestjs/common';
import { EmailSenderController } from './email-sender.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { synchronizePostgres } from '../../common/utils/sync';
import { EventsModule } from '../events/events.module';
import { EMAIL_CONNECTION } from './ormconfig';
import { Email } from './models/email.entity';
import { EmailEvent } from './models/email-event.entity';
import { EmailTemplateData } from './models/email-template-data.entity';
import { EmailSenderService } from './services/email-sender.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EmailSenderConsumerService } from './services/email-sender-consumer';
import { CacheModule } from '../_core/cache/cache.module';
import { EmailSendingSettingController } from './controllers/email-sending-setting.controller';
import { EmailSendingSettingService } from './services/email-sending-setting.service';
import { EmailSendingSetting } from './models/email-sending-setting.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: EMAIL_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'email',
        }),
        TypeOrmModule.forFeature([Email, EmailEvent, EmailTemplateData, EmailSendingSetting], EMAIL_CONNECTION),
        EventsModule,
        CacheModule,
    ],
    controllers: [EmailSenderController, EmailSendingSettingController],
    providers: [EmailSenderService, EmailSenderConsumerService, EmailSendingSettingService],
    exports: [EmailSenderService, EmailSendingSettingService],
})
export class EmailSenderModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(EmailSenderController, EmailSendingSettingController);
    }
}
