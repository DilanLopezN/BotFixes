import { Injectable } from '@nestjs/common';
import { ContextMessageService } from '../../context-message/context-message.service';
import { HistoricStorageService } from '../storage/historic-storage.service';
import { CreateContextMessage } from '../../context-message/interfaces/create-context-message.interface';
import { IContextMessage } from '../../context-message/interfaces/context-message.interface';

@Injectable()
export class ContextMessagePersistenceService {
    constructor(
        private readonly contextMessageService: ContextMessageService,
        private readonly historicStorageService: HistoricStorageService,
    ) {}

    public async createAndCache(newMessage: CreateContextMessage): Promise<IContextMessage> {
        const message = await this.contextMessageService.create(newMessage);

        if (!newMessage.isFallback) {
            await this.historicStorageService.createContextMessage(message);
        }

        return message;
    }

    public async bulkCreateAndCache(messages: CreateContextMessage[]): Promise<IContextMessage[]> {
        const createdMessages: IContextMessage[] = [];

        for (const message of messages) {
            const createdMessage = await this.createAndCache(message);
            createdMessages.push(createdMessage);
        }

        return createdMessages;
    }
}
