import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactSearch } from 'kissbot-entities';
import { ANALYTICS_CONNECTION } from '../consts';
import { ContactSearchConsumerService } from './services/contact-search-consumer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ContactSearch], ANALYTICS_CONNECTION),
    ],
    providers: [ContactSearchConsumerService],
    controllers: [],
    exports: [],
})
export class ContactSearchModule {}
