import { BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as heicConvert from 'heic-convert';
import { File } from '../interfaces/uploaded-file';

export const stripMetadata = async (
  file: File,
): Promise<{
  buffer: Buffer;
  mimetype: string;
}> => {
  try {
    let imageBuffer = file.buffer;

    // Converte HEIC para JPEG antes de processar com o sharp
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      const convertedBuffer = Buffer.from(
        await heicConvert({
          buffer: imageBuffer,
          format: 'JPEG',
          quality: 0.9,
        }),
      );

      imageBuffer = convertedBuffer;
    }

    const sanitizedBuffer = await sharp(imageBuffer)
      .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      buffer: sanitizedBuffer,
      mimetype: 'image/jpeg', // O tipo final é sempre JPEG após este processo
    };
  } catch (error) {
    console.error('Falha ao sanitizar a imagem:', error);
    throw new BadRequestException('Arquivo de imagem inválido, corrupto ou formato não suportado.');
  }
};
