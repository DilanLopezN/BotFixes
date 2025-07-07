import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationFlowService } from './services/converstion-flow.service';
import { ConversationFlow } from 'kissbot-entities'
import { ANALYTICS_CONNECTION } from '../consts';
import { FlowConsumerService } from './services/flow-consumer.service';

@Module({
  providers: [ConversationFlowService, FlowConsumerService],
  imports: [
    TypeOrmModule.forFeature(
      [
        ConversationFlow,
      ],
      ANALYTICS_CONNECTION,
    ),
  ],
})
export class ConversationFlowModule {}
