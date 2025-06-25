import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileUploaderModule } from './../../common/file-uploader/file-uploader.module';
import { ActivityModule } from '../activity/activity.module';
import { ConversationModule } from '../conversation/conversation.module';
import { AttachmentSchema } from './schemas/attachment.schema';
import { AttachmentService } from './services/attachment.service';
import { CacheModule } from '../_core/cache/cache.module';
import { PublicAttachmentController } from './controllers/public-attachment.controller';
import { EventsModule } from '../events/events.module';
import { AttachmentController } from './controllers/attachment.controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { TemplateMessageModule } from '../template-message/template-message.module';
import { TagsModule } from '../tags/tags.module';
import { TeamModule } from '../team/team.module';

@Module({
    providers: [AttachmentService],
    controllers: [
      PublicAttachmentController,
      AttachmentController,
    ],
    exports: [AttachmentService],
    imports: [
      MongooseModule.forFeature([{ name: 'Attachment', schema: AttachmentSchema }]),
      ActivityModule,
      forwardRef(() => ConversationModule),
      FileUploaderModule,
      CacheModule,
      EventsModule,
      TemplateMessageModule,
      TagsModule,
      TeamModule,
    ]
})
export class AttachmentModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AttachmentController);
  }
}
