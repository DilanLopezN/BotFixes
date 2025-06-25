export interface FileUploaderProvider {
    upload: (file: string | Buffer, fileName?: string, contentType?: string) => Promise<string> | string;
    getUrl: (fileKey, options?: any) => Promise<string> | string;
}
