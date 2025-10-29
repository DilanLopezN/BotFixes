import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AttachmentService } from '../../../attachment/services/attachment.service';

@Injectable()
export class ExternalDataService implements OnApplicationBootstrap {
    private attachmentService: AttachmentService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.attachmentService = this.moduleRef.get<AttachmentService>(AttachmentService, { strict: false });
    }

    async createAndUpload(
        file: any,
        conversationId: string,
        memberId: string,
        text: string,
    ): Promise<{ attachmentLocation: string; attachmentId: string }> {
        try {
            const attachment = await this.attachmentService.createAndUpload(
                file,
                conversationId,
                memberId,
                false,
                text,
            );

            return {
                attachmentLocation: attachment.attachmentLocation,
                attachmentId: attachment._id.toString(),
            };
        } catch (error) {
            throw new Error(`Failed to create and upload file: ${error.message}`);
        }
    }
}
