import { CacheModule } from './../_core/cache/cache.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { TeamSchema } from './schemas/team.schema';
import { TeamController } from './team.controller';
import { TeamService } from './services/team.service';
import { EventsModule } from '../events/events.module';
import { TeamHistorySchema } from './schemas/teamHistory.schema';
import { TeamHistoryService } from './services/teamHistory.service';
import { ExternalDataService } from './services/external-data.service';

@Module({
    imports: [
        CacheModule,
        EventsModule,
        MongooseModule.forFeature([
            { name: 'Team', schema: TeamSchema },
            { name: 'TeamHistory', schema: TeamHistorySchema },
        ]),
    ],
    controllers: [TeamController],
    providers: [TeamService, TeamHistoryService, ExternalDataService],
    exports: [TeamService, TeamHistoryService],
})
export class TeamModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(TeamController);
    }
}
