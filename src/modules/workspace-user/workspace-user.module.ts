import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { WorkspaceUserService } from './workspace-user.service';
import { WorkspaceUserController } from './workspace-user.controller';
import { UsersModule } from './../users/users.module';
import { BotsModule } from './../bots/bots.module';
import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { EventsModule } from '../events/events.module';
import { CacheModule } from '../_core/cache/cache.module';
import { TeamModule } from '../team-v2/team.module';

@Module({
    imports: [
        forwardRef(() => UsersModule),
        BotsModule,
        EventsModule,
        CacheModule,
        TeamModule,
    ],
    providers: [WorkspaceUserService],
    controllers: [WorkspaceUserController],
    exports: [WorkspaceUserService],
})
export class WorkspaceUserModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(WorkspaceUserController);
    }
}
