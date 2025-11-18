export interface S3ModuleOptions {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3UploadOptions {
  bucketName: string;
  key: string;
  body: Buffer | Uint8Array | Blob | string | ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3GetSignedUrlOptions {
  bucketName: string;
  key: string;
  expiresIn?: number;
}

export interface S3GetOptions {
  bucketName: string;
  key: string;
}

export interface S3DeleteOptions {
  bucketName: string;
  key: string;
}

export interface S3ListOptions {
  bucketName: string;
  prefix?: string;
  maxKeys?: number;
}

export interface S3FileMetadata {
  key: string;
  lastModified?: Date;
  size?: number;
  eTag?: string;
}
