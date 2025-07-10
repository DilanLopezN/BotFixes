import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationAttributeService } from './service/conversation-attribute.service';
import { ConversationAttributeSchema } from './schemas/conversation-attribute.schema';
import { EventsModule } from '../events/events.module';
import { ConversationAttributeModuleV2 } from '../conversation-attribute-v2/conversation-attribute.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
    providers: [ConversationAttributeService],
    exports: [ConversationAttributeService],
    imports: [
        MongooseModule.forFeature([{ name: 'ConversationAttribute', schema: ConversationAttributeSchema }]),
        EventsModule,
        ConversationAttributeModuleV2,
        WorkspacesModule,
    ],
})
export class ConversationAttributeModule {}
