import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationSearchConsumerService } from './services/conversation-search.consumer.service';
import { ConversationSearch } from 'kissbot-entities';
import { ANALYTICS_CONNECTION } from '../consts';
@Module({
    imports: [
        TypeOrmModule.forFeature([ConversationSearch], ANALYTICS_CONNECTION),
    ],
    providers: [ConversationSearchConsumerService],
})
export class ConversationSearchModule {
}
