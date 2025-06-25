import { UnsupportedMediaTypeException } from '@nestjs/common';
import * as mime from 'mime-types';

export function fileMimetypeFilter(extensions: string[]) {
    return (req, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
        const mimes = extensions.map((extension) => mime.lookup(extension));

        if (mimes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new UnsupportedMediaTypeException(`File type is not matching}`), false);
        }
    };
}
