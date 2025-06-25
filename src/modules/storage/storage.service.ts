import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { Base64File, getBase64FileData } from '../../common/utils/file.util';
import * as moment from 'moment';

@Injectable()
export class StorageService {
    private readonly s3: S3;

    /**
     * Create a new service instance.
     */
    public constructor() {
        this.s3 = new S3({
            region: process.env.AWS_WORKSPACE_REGION_NAME,
        });
    }

    /**
     * Store a base64 encoded file.
     *
     * @param  {Base64File} file
     * @return {Promise<{url: string}>}
     */
    public async store(key: string, file: Base64File): Promise<{ url: string }> {
        const fileData = await getBase64FileData(file);
        let buffer: Buffer;
        if (typeof file.contents == 'string') {
            buffer = Buffer.from(file.contents, 'base64');
        } else {
            buffer = file.contents;
        }
        const name = `${key}.${fileData.ext}`;

        await this.s3
            .putObject({
                ACL: 'public-read',
                Key: name,
                Body: buffer,
                Bucket: process.env.AWS_WORKSPACE_BUCKET_NAME,
                ContentType: fileData.mime,
            })
            .promise();

        return {
            url: `https://${process.env.AWS_WORKSPACE_BUCKET_NAME}.s3.amazonaws.com/${name}`,
        };
    }

    private convertToBuffer(file: Buffer | string): Buffer {
        if (typeof file == 'string') {
            return Buffer.from(file);
        }
        return file as Buffer;
    }

    async upload(file: Buffer | string, fileName: string, contentType?: string, isPrivate?: boolean): Promise<string> {
        const bufferFile: Buffer = this.convertToBuffer(file);
        const options: S3.Types.PutObjectRequest = {
            Bucket: process.env.AWS_WORKSPACE_BUCKET_NAME,
            Key: fileName,
            Body: bufferFile,
            ACL: (isPrivate ? 'private' : 'public-read'),
        };

        if (contentType) {
            options.ContentType = contentType;
        }

        const s3Response = await this.s3
            .upload(options)
            .promise()
            .catch((e) => {
                console.log('erro ao fazer upload para o s3', e, fileName);
            });

        return (s3Response as S3.ManagedUpload.SendData).Location;
    }

    /**
     * Delete a file from storage.
     *
     * @param  {string} name
     * @return {Promise<boolean>}
     */
    public async delete(key: string): Promise<boolean> {
        try {
            await this.s3
                .deleteObject({
                    Key: key,
                    Bucket: process.env.AWS_WORKSPACE_BUCKET_NAME,
                })
                .promise();

            return true;
        } catch (e) {
            return false;
        }
    }

    private getCopyBucketName() {
        return process.env.AWS_WORKSPACE_BUCKET_NAME + '-copy';
    }

    public getSignedUrl(fileKey: string, fromCopyBucket?: boolean) {
        let bucketName = process.env.AWS_WORKSPACE_BUCKET_NAME;
        if (fromCopyBucket) {
            bucketName = this.getCopyBucketName();
        }
        const params = { Bucket: bucketName, Key: fileKey, Expires: 3600000 };
        return this.s3.getSignedUrl('getObject', params);
    }
    public async copyToBucket(fileKey: string, newFileKey: string, newBucket: string) {
        await this.s3
            .copyObject({
                Bucket: newBucket,
                CopySource: encodeURI(`/${process.env.AWS_WORKSPACE_BUCKET_NAME}/${fileKey}`),
                Key: newFileKey,
                ACL: 'private',
            })
            .promise();
    }
    public async copyToCopyBucket(fileKey: string, newFileKey: string, newBucket: string) {
        await this.s3
            .copyObject({
                Bucket: newBucket,
                CopySource: encodeURI(`/${process.env.AWS_WORKSPACE_BUCKET_NAME}/${fileKey}`),
                Key: newFileKey,
                ACL: 'public-read',
                Expires: moment().add(2, 'minute').toDate(),
            })
            .promise();
    }
}
