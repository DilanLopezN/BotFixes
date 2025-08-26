import { ApiTags, ApiParam } from '@nestjs/swagger';
import { Controller, Post, Param, UploadedFile, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from '../services/attachment.service';
import { UserDecorator } from './../../../decorators/user.decorator';
import { User } from './../../../modules/users/interfaces/user.interface';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';

@Controller('conversations')
@ApiTags('Conversation')
export class AttachmentController {
    constructor(private readonly attachmentService: AttachmentService) {}

    @Post(':conversationId/members/:memberId/attachments')
    @ApiParam({ name: 'conversationId', type: String })
    @ApiParam({ name: 'memberId', type: String })
    @UseInterceptors(FileInterceptor('attachment', { limits: { fileSize: 10000000 } }))
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
    }
}
