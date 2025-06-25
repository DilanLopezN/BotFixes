import {
    Body,
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { ResendNotProcessedActiveMessagesDto } from '../dto/resend-not-processed-active-messages.dto';
import { SendMessageService } from '../services/send-message.service';
@Controller('send-active-message-incoming-data')
export class SendActiveMessageIncomingController {
    constructor(
        private readonly sendMessageService: SendMessageService,
    ) {}

    @Post('/resendNotProcessedActiveMessages')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard)
    async resendNotProcessedActiveMessages(
        @Body() body: ResendNotProcessedActiveMessagesDto
    ) {
        await this.sendMessageService.resendNotProcessedActiveMessages(body);
    }
}