import { CacheModule } from './../../_core/cache/cache.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { TeamSchema } from '../schemas/team.schema';
import { EventsModule } from '../../events/events.module';
import { ConversationModule } from '../../conversation/conversation.module';
import { DeleteTeamService } from './delete-team.service';
import { DeleteTeamController } from './deleteTeam.controller';

@Module({
    imports: [
        CacheModule,
        EventsModule,
        MongooseModule.forFeature([{ name: 'Team', schema: TeamSchema }]),
        ConversationModule,
    ],
    controllers: [DeleteTeamController],
    providers: [DeleteTeamService],
    exports: [],
})
export class DeleteTeamModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(DeleteTeamController);
    }
}
