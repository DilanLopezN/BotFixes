import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivateConversationDataSchema } from './schemas/private-conversation-data.schema';
import { PrivateConversationDataService } from './services/private-conversation-data.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PrivateConversationData', schema: PrivateConversationDataSchema },
    ]),
  ],
  providers: [PrivateConversationDataService],
  exports: [PrivateConversationDataService]
})
export class PrivateConversationDataModule {}
