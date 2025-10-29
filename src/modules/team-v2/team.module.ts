import { CacheModule } from './../_core/cache/cache.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { TeamSchema } from '../team/schemas/team.schema';
import { TeamController } from './team.controller';
import { TeamService } from './services/team.service';
import { EventsModule } from '../events/events.module';
import { ExternalDataService } from '../team-v2/services/external-data.service';
import { TeamCacheService } from './services/team-cache.service';
import { TeamHistorySchema } from '../team/schemas/teamHistory.schema';
import { TeamHistoryService } from './services/teamHistory.service';
import { InternalTeamController } from './controllers/internal-team.controller';

@Module({
    imports: [
        CacheModule,
        EventsModule,
        MongooseModule.forFeature([
            { name: 'Team', schema: TeamSchema },
            { name: 'TeamHistory', schema: TeamHistorySchema },
        ]),
    ],
    controllers: [TeamController, InternalTeamController],
    providers: [TeamService, ExternalDataService, TeamCacheService, TeamHistoryService],
    exports: [TeamService, TeamHistoryService],
})
export class TeamModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(TeamController);
    }
}
