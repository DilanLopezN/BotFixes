import { CacheModule } from './../_core/cache/cache.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthMiddleware } from '../../modules/auth/middleware/auth.middleware';
import { TemplateMessageSchema } from './schema/template-message.schema';
import { TemplateMessageService } from './services/template-message.service';
import { TemplateMessageController } from './controllers/template-message.controller';
import { EventsModule } from '../events/events.module';
import { StorageModule } from '../storage/storage.module';
import { PublicTemplateMessageController } from './controllers/public-template-message.controller';
import { ExternalDataService } from './services/external-data.service';
import { TemplateMessageHistorySchema } from './schema/template-message-history.schema';
import { TemplateMessageHistoryService } from './services/template-message-history.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'TemplateMessage', schema: TemplateMessageSchema },
            { name: 'TemplateMessageHistory', schema: TemplateMessageHistorySchema },
        ]),
        CacheModule,
        EventsModule,
        StorageModule,
    ],
    providers: [TemplateMessageService, TemplateMessageHistoryService, ExternalDataService],
    exports: [TemplateMessageService, TemplateMessageHistoryService],
    controllers: [PublicTemplateMessageController, TemplateMessageController],
})
export class TemplateMessageModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(AuthMiddleware).forRoutes(TemplateMessageController);
    }
}
