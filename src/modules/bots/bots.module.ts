import { forwardRef, Global, Module, MiddlewareConsumer } from '@nestjs/common';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BotSchema } from './schemas/bot.schema';
import { InteractionsModule } from '../interactions/interactions.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { WorkspacesModule } from './../workspaces/workspaces.module';
import { EventsModule } from './../events/events.module';
import { ChannelConfigModule } from './../channel-config/channel-config.module';
import { CacheModule } from './../_core/cache/cache.module';
import { BotAttributesModule } from '../botAttributes/botAttributes.module';
import { ExternalDataService } from './services/external-data.service';

@Global()
@Module({
    controllers: [BotsController],
    imports: [
        MongooseModule.forFeature([{ name: 'Bot', schema: BotSchema }]),
        forwardRef(() => InteractionsModule),
        WorkspacesModule,
        EventsModule,
        forwardRef(() => ChannelConfigModule),
        CacheModule,
        BotAttributesModule,
        EventsModule,
    ],
    providers: [BotsService, ExternalDataService],
    exports: [BotsService],
})
export class BotsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(BotsController);
    }
}
