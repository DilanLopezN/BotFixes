import { Body, ConflictException, Controller, Post, Query, ValidationPipe } from '@nestjs/common';
import { CheckConversationExistsDto } from '../dto/check-conversation-exists.dto';
import { ListMessagesDto } from '../dto/list-messages.dto';
import { SendActiveMessageClassDto } from '../dto/send-message.dto';
import { ActiveMessageService } from '../services/active-message.service';
import { SendMessageService } from '../services/send-message.service';

@Controller('v1/messages')
export class ExternalActiveMessageV1Controller {
    constructor(
        private readonly sendMessageService: SendMessageService,
        private readonly activeMessageService: ActiveMessageService,
    ) {}

    @Post('sendMessage')
    async sendMessage(@Body(new ValidationPipe({ transform: true })) body: SendActiveMessageClassDto) {
        return this.sendMessageService.enqueueMessage(body);
    }

    @Post('listMessages')
    async getMessageByExternalId(@Body() body: ListMessagesDto) {
        return this.activeMessageService.listMessages(body);
    }

    @Post('checkConversationExists')
    async checkConversationExists(
        @Body() body: CheckConversationExistsDto,
        @Query('throwExceptionIfHasConversation') throwExceptionIfHasConversation,
    ) {
        const result = await this.sendMessageService.checkConversationExists(body);
        if (throwExceptionIfHasConversation && result.hasConversation) {
            throw new ConflictException('Já existe uma conversa');
        }
        return result;
    }
}
