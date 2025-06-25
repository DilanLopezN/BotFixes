import * as fs from 'fs';
import * as tmp from 'tmp-promise';
import * as fileType from 'file-type';

export interface Base64File {
  contents: string | Buffer;
}

export interface Base64FileData {
  size: number;
  mime: string;
  ext: string;
}

export class InvalidBase64FileError extends Error {
  public constructor() {
    super('Cannot get file data from an invalid base64 encoded file.');
    this.name = this.constructor.name;
  }
}

/**
 * Get data from a base64 encoded file.
 *
 * @param  {Base64File} file
 * @return {Promise<Base64FileData>}
 * @throws {InvalidBase64FileError}
 */
export const getBase64FileData = async (file: Base64File): Promise<Base64FileData> => {
  const tempFile = await tmp.file();

  await fs.promises.writeFile(tempFile.path, file.contents, 'base64');

  const tempFileStat = await fs.promises.stat(tempFile.path);
  const tempFileType = await fileType.fromFile(tempFile.path);

  tempFile.cleanup();

  if (!tempFileType) {
    throw new InvalidBase64FileError();
  }

  return {
    size: tempFileStat.size,
    mime: tempFileType.mime,
    ext: tempFileType.ext,
  };
};
