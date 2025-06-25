export interface FileToUpload {
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    originalname?: string;
    extension?: string;
}
