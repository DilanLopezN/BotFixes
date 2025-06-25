import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationAttributeService } from './service/conversation-attribute.service';
import { ConversationAttributeSchema } from './schemas/conversation-attribute.schema';
import { EventsModule } from '../events/events.module';
@Module({
  providers: [ConversationAttributeService],
  exports: [ConversationAttributeService],
  imports: [
    MongooseModule.forFeature([{ name: 'ConversationAttribute', schema: ConversationAttributeSchema }]),
    EventsModule,
  ]
})
export class ConversationAttributeModule {}
