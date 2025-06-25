import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EntitySchema } from './schemas/entity.schema';
import { EntitiesController } from './entities.controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { EventsModule } from '../events/events.module';

@Module({
    controllers: [EntitiesController],
    imports: [
        MongooseModule.forFeature([{ name: 'Entity', schema: EntitySchema }]),
        forwardRef(() => WorkspacesModule),
        EventsModule,
    ],
    providers: [EntitiesService],
    exports: [EntitiesService],
})
export class EntitiesModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(EntitiesController);
    }
}
