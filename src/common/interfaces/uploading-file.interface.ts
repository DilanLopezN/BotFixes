export interface UploadingFile {
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    originalname?: string;
    extension?: string;
}