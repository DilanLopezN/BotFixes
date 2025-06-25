import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../../../config/config.module';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ConversationSearch } from 'kissbot-entities';
import { ConversationSearchService } from './services/conversation-search.service';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([ConversationSearch], ANALYTICS_READ_CONNECTION)],
    providers: [ConversationSearchService],
    exports: [ConversationSearchService],
})
export class ConversationSearchModule {}
