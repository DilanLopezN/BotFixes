import { Module } from '@nestjs/common';
import { FileUploaderService } from './file-uploader.service';
import { FileUploaderS3Service } from './providers/file-uploader-s3.service';

@Module({
    providers: [
        FileUploaderService,
        FileUploaderS3Service,
    ],
    exports: [
        FileUploaderService,
    ],
})
export class FileUploaderModule {}
