import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3ClientConfig,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import {
  S3UploadOptions,
  S3GetOptions,
  S3DeleteOptions,
  S3ListOptions,
  S3FileMetadata,
  S3GetSignedUrlOptions,
} from './s3.interface';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly region = 'sa-east-1';

  constructor() {
    const s3Config: S3ClientConfig = {
      region: this.region,
    };

    this.s3Client = new S3Client({
      ...s3Config,
      credentials: fromNodeProviderChain({
        clientConfig: { region: this.region },
      }),
    });
  }

  async getSignedUrl({ bucketName, key, expiresIn = 3600 }: S3GetSignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });
  }

  async uploadFile(options: S3UploadOptions): Promise<{
    eTag?: string;
    location: string;
  }> {
    const { bucketName, key, body, contentType, metadata } = options;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    };

    try {
      const command = new PutObjectCommand(params);
      const response = await this.s3Client.send(command);

      return {
        eTag: response.ETag,
        location: `https://${bucketName}.s3.${this.region}.amazonaws.com/${key}`,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async updateFile(options: S3UploadOptions): Promise<{
    eTag?: string;
    location: string;
  }> {
    return this.uploadFile(options);
  }

  async getFile(options: S3GetOptions): Promise<{
    body: any;
    contentType?: string;
    contentLength?: number;
    metadata?: Record<string, string>;
  }> {
    const { bucketName, key } = options;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);

      return {
        body: response.Body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        metadata: response.Metadata,
      };
    } catch (error) {
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }

  async fileExists(options: S3GetOptions): Promise<boolean> {
    const { bucketName, key } = options;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      const command = new HeadObjectCommand(params);
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw new Error(`Failed to check if file exists in S3: ${error.message}`);
    }
  }

  async deleteFile(options: S3DeleteOptions): Promise<boolean> {
    const { bucketName, key } = options;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  async listFiles(options: S3ListOptions): Promise<S3FileMetadata[]> {
    const { bucketName, prefix = '', maxKeys = 1000 } = options;

    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    };

    try {
      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((item) => ({
        key: item.Key as string,
        lastModified: item.LastModified,
        size: item.Size,
        eTag: item.ETag,
      }));
    } catch (error) {
      throw new Error(`Failed to list files in S3: ${error.message}`);
    }
  }
}
