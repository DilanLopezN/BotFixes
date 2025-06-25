import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { BotsPublicationsHistoryService } from './bot-publication-history.service';
import { BotsPublicationsHistorySchema } from './schema/bot-publication-history.schema';

@Module({
    controllers: [],
    imports: [MongooseModule.forFeature([{ name: 'BotsPublicationsHistory', schema: BotsPublicationsHistorySchema }])],
    providers: [BotsPublicationsHistoryService],
    exports: [BotsPublicationsHistoryService],
})
export class BotPublicationHistoryModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes();
    }
}
