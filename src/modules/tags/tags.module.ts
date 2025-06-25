import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TagsSchema } from './schema/tags.schema';
import { AuthMiddleware } from '../../modules/auth/middleware/auth.middleware';
import { CacheModule } from '../_core/cache/cache.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Tags', schema: TagsSchema }]),
        CacheModule,
        EventsModule,
    ],
    providers: [TagsService],
    exports: [TagsService],
    controllers: [TagsController],
})

export class TagsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(TagsController);
    }
}
