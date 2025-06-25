import { Injectable } from '@nestjs/common';
import { FileUploaderProvider } from './interfaces/file-uploader-provider.interface';
import { ModuleRef } from '@nestjs/core';
import { FileUploaderS3Service } from './providers/file-uploader-s3.service';
import { FileToUpload } from './interfaces/file-to-upload.interface';

@Injectable()
export class FileUploaderService {
    private fileStoreProvider: string = process.env.FILE_STORE_PROVIDER || 'AWS_S3';

    constructor(private readonly moduleRef: ModuleRef) {}

    /**
     * Retorna o endereço do arquivo
     * @param file
     */
    upload(file: FileToUpload): Promise<string> | string {
        return this.getUploaderProvider(this.fileStoreProvider).upload(file.buffer, file.originalname, file.mimetype);
    }

    /**
     * Retorna url autenticada para acessar arquivo privado
     * @param file
     */
    getAuthUrl(fileKey: string, options?: any): Promise<string> | string {
        return this.getUploaderProvider(this.fileStoreProvider).getUrl(fileKey, options);
    }

    private getUploaderProvider(provider: string): FileUploaderProvider {
        switch (provider) {
            case 'AWS_S3':
                return this.moduleRef.get<FileUploaderProvider>(FileUploaderS3Service);
            default:
                return this.moduleRef.get<FileUploaderProvider>(FileUploaderS3Service);
        }
    }
}
