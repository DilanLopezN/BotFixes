import { forwardRef, Global, Module, MiddlewareConsumer } from '@nestjs/common';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './services/interactions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionSchema } from './schemas/interaction.schema';
import { InteractionPublishedSchema } from './schemas/interaction-published.schema';
import { BotsModule } from '../bots/bots.module';
import { BotAttributesModule } from '../botAttributes/botAttributes.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CacheModule } from '../_core/cache/cache.module';
import { EntitiesModule } from '../entities/entities.module';
import { InteractionUpdateService } from './services/interactionUpdate.service';
import { InteractionSharedService } from './services/interactionShared.service';
import { CreateAttributesService } from './services/createAttributes.service';
import { EventsModule } from './../events/events.module';
import { TeamModule } from '../team/team.module';
import { InteractionHistorySchema } from './schemas/interactionHistory.schema';
import { InteractionHistoryService } from './services/interactionHistory.service';
import { BotPublicationHistoryModule } from '../bot-publication-history/bot-publication-history.module';
import { ExternalDataService } from './services/external-data.service';

@Global()
@Module({
    controllers: [InteractionsController],
    imports: [
        MongooseModule.forFeature([
            { name: 'Interaction', schema: InteractionSchema },
            { name: 'InteractionPublished', schema: InteractionPublishedSchema },
            { name: 'InteractionHistory', schema: InteractionHistorySchema },
        ]),
        forwardRef(() => BotsModule),
        BotAttributesModule,
        WorkspacesModule,
        CacheModule,
        EventsModule,
        EntitiesModule,
        TeamModule,
        BotPublicationHistoryModule,
    ],
    providers: [
        InteractionsService,
        InteractionUpdateService,
        InteractionSharedService,
        CreateAttributesService,
        InteractionHistoryService,
        ExternalDataService,
    ],
    exports: [InteractionsService, InteractionHistoryService],
})
export class InteractionsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(InteractionsController);
    }
}
