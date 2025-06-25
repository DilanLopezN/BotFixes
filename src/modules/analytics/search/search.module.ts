import { Module } from '@nestjs/common';
import { ConversationSearchModule } from './conversation-search/conversation-search.module';
import { ActivitySearchModule } from './activity-search/activity-search.module';
import { ContactSearchModule } from './contact-search/contact-search.module';

@Module({
    imports: [ConversationSearchModule, ActivitySearchModule, ContactSearchModule],
})
export class SearchModule {}
