import { Injectable, BadRequestException } from '@nestjs/common';
import { FileUploaderProvider } from '../interfaces/file-uploader-provider.interface';
import { S3 } from 'aws-sdk';
import * as moment from 'moment';
import * as Sentry from '@sentry/node';
import { v4 } from 'uuid';
interface GetUrlOptions {
    fromCopyBucket: boolean;
}
@Injectable()
export class FileUploaderS3Service implements FileUploaderProvider {
    private bucketName = process.env.AWS_ATTACHMENTS_BUCKET_NAME;
    private copyBucketName = this.bucketName + '-copy';
    private s3: S3 = new S3({
        region: process.env.AWS_ATTACHMENTS_REGION_NAME,
    });

    private isCreatingBucket = false;

    constructor() {
        this.ensureBucketIsCreated();
    }

    private async ensureBucketIsCreated() {
        this.isCreatingBucket = true;
        try {
            if (!this.bucketName) {
                return;
            }
            await this.s3
                .createBucket({
                    Bucket: this.bucketName,
                    ACL: 'private',
                })
                .promise();
        } catch (e) { }
        try {
            if (!this.copyBucketName) {
                return;
            }
            await this.s3
                .createBucket({
                    Bucket: this.copyBucketName,
                    ACL: 'public-read',
                })
                .promise();
        } catch (e) { }
        this.isCreatingBucket = false;
    }

    async upload(file: Buffer | string, fileName?: string, contentType?: string) {
        try {
            if (this.isCreatingBucket) {
                throw new BadRequestException('Bucket is being created, try again in some seconds');
            }
            const bufferFile: Buffer = this.convertToBuffer(file);
            const options: S3.Types.PutObjectRequest = {
                Bucket: this.bucketName,
                Key: fileName || v4(),
                Body: bufferFile,
                ACL: 'private',
            };

            if (contentType) {
                options.ContentType = contentType;
            }

            const s3Response = (await this.s3
                .upload(options)
                .promise()
                .catch((e) => {
                    console.log('erro ao fazer upload para o s3', e, fileName);
                })) as any;

            await this.s3
                .copyObject({
                    Bucket: this.copyBucketName,
                    CopySource: encodeURI(`/${this.bucketName}/${s3Response.Key}`),
                    Key: s3Response.Key,
                    ACL: 'public-read',
                    Expires: moment().add(2, 'minute').toDate(),
                })
                .promise();

            return s3Response.Location;
        } catch (e) {
            try {
                let messageErr = e;
                if ((e?.response?.data?.toString) && typeof (e?.response?.data?.toString) == 'function') {
                    messageErr = e?.response?.data?.toString();
                }
                Sentry.captureEvent({
                    message: 'FileUploaderS3Service.upload', extra: {
                        error: messageErr,
                        fileName,
                        contentType,
                    }
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'FileUploaderS3Service.upload catch 2', extra: {
                        error: e,
                    }
                });
            }
            throw e;
        }
    }

    private convertToBuffer(file: Buffer | string): Buffer {
        if (typeof file == 'string') {
            return Buffer.from(file);
        }
        return file as Buffer;
    }

    public getUrl(fileKey: string, options: GetUrlOptions) {
        let bucketName = this.bucketName;
        if (options?.fromCopyBucket) {
            bucketName = this.copyBucketName;
        }
        const params = { Bucket: bucketName, Key: fileKey, Expires: 3600000 };
        return this.s3.getSignedUrl('getObject', params);
    }
}
