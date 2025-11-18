export interface File {
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  originalname: string;
  fieldName: string;
}
