import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceAccessGroupService } from './services/workspace-access-group.service';
import { WorkspaceAccessGroupController } from './workspace-access-group.controller';
import { WorkspaceAccessControlSchema } from './schemas/workspace-access-control.schema';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CacheModule } from '../_core/cache/cache.module';
import { EventsModule } from '../events/events.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'WorkspaceAccessControl', schema: WorkspaceAccessControlSchema },
    ]),
    CacheModule,
    EventsModule
  ],
  providers: [WorkspaceAccessGroupService],
  exports: [WorkspaceAccessGroupService],
  controllers: [WorkspaceAccessGroupController]
})
export class WorkspaceAccessGroupModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(WorkspaceAccessGroupController);
  }
}
