import { Global, Module, MiddlewareConsumer } from '@nestjs/common';
import { CloneBotController } from './clone-bot.controller';
import { CloneBotService } from './clone-bot.service';
import { InteractionsModule } from '../../interactions/interactions.module';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { EventsModule } from './../../events/events.module';
import { BotAttributesModule } from '../../botAttributes/botAttributes.module';
import { BotsModule } from '../bots.module';
import { EntitiesModule } from '../../entities/entities.module';
import { TeamModule } from '../../team/team.module';
import { WorkspacesModule } from '../../workspaces/workspaces.module';

@Global()
@Module({
    controllers: [CloneBotController],
    imports: [
        WorkspacesModule,
        InteractionsModule,
        BotAttributesModule,
        EventsModule,
        BotsModule,
        EntitiesModule,
        TeamModule,
    ],
    providers: [CloneBotService],
    exports: [CloneBotService],
})
export class CloneBotModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(CloneBotController);
    }
}
