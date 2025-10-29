import { ApiTags, ApiParam } from '@nestjs/swagger';
import {
    Controller,
    Post,
    Param,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Body,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from '../services/attachment.service';
import { UserDecorator } from './../../../decorators/user.decorator';
import { User } from './../../../modules/users/interfaces/user.interface';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';
import whatsappFileFilter, { validateWhatsappFile } from './../../../common/utils/whatsappFileFilter';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('conversations')
@ApiTags('Conversation')
export class AttachmentController {
    constructor(private readonly attachmentService: AttachmentService) {}

    @Post(':conversationId/members/:memberId/attachments')
    @ApiParam({ name: 'conversationId', type: String })
    @ApiParam({ name: 'memberId', type: String })
    @UseGuards(ThrottlerGuard, AuthGuard)
    @Throttle(10, 60)
    @UseInterceptors(
        FileInterceptor('attachment', { limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: whatsappFileFilter }),
    ) // 100MB
    create(
        @Param('conversationId') conversationId: string,
        @Param('memberId') memberId: string,
        @UploadedFile() file: UploadingFile,
        @Body() data: any,
        @UserDecorator() user: User,
    ) {
        this.validateFile(file);
        return this.attachmentService.createAndUpload(
            file,
            conversationId,
            memberId,
            false,
            data.message || '',
            data.templateId,
            user,
            data.hash,
            data.type,
        );
    }

    private validateFile(file: UploadingFile): void {
        if (!file) {
            throw new BadRequestException('Missing file!');
        }

        validateWhatsappFile(file as Express.Multer.File);
    }
}
