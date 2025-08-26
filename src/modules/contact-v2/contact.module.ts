import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTACT_CONNECTION } from './ormconfig';
import { EventsModule } from '../events/events.module';
import { ConversationModule } from '../conversation/conversation.module';
import { CacheModule } from '../_core/cache/cache.module';
import { ChannelConfigModule } from '../channel-config/channel-config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ContactEntity } from './entities/contact.entity';
import { BlockedContactEntity } from './entities/blocked-contact.entity';
import { ContactService } from './services/contact.service';
import { BlockedContactService } from './services/blocked-contact.service';
import { ContactQueueConsumerService } from './services/contact-queue-consumer.service';
import { ContactController } from './controllers/contact-controller';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONTACT_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            synchronize: false,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation',
            extra: {
                min: 1,
            },
        }),
        TypeOrmModule.forFeature([ContactEntity, BlockedContactEntity], CONTACT_CONNECTION),
        EventsModule,
        forwardRef(() => ConversationModule),
        CacheModule,
        ChannelConfigModule,
    ],
    providers: [ContactService, BlockedContactService, ContactQueueConsumerService],
    controllers: [ContactController],
    exports: [ContactService, BlockedContactService],
})
export class ContactModuleV2 {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContactController);
    }
}
