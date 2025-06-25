import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './services/workspaces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceSchema } from './schemas/workspace.schema';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CacheModule } from '../_core/cache/cache.module';
import { SyncWorkspacesDialogflowService } from './services/sync-workspace-dialogflow.service';
import { EntitiesModule } from '../entities/entities.module';
import { EventsModule } from './../events/events.module';
import { WorkspaceAccessGroupModule } from '../workspace-access-group/workspace-access-group.module';
import { ExternalDataService } from './services/external-data.service';
@Module({
    controllers: [WorkspacesController],
    imports: [
        forwardRef(() => EntitiesModule),
        MongooseModule.forFeature([{ name: 'Workspace', schema: WorkspaceSchema }]),
        CacheModule,
        EventsModule,
        WorkspaceAccessGroupModule,
    ],
    providers: [WorkspacesService, SyncWorkspacesDialogflowService, ExternalDataService],
    exports: [WorkspacesService],
})
export class WorkspacesModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(WorkspacesController);
    }
}
