import { BadRequestException } from '@nestjs/common';

interface MediaRule {
    maxSize: number; // bytes
    mimes: string[];
}

const WHATSAPP_MEDIA_RULES: Record<string, MediaRule> = {
    image: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        mimes: ['image/jpeg', 'image/png'],
    },
    audio: {
        maxSize: 16 * 1024 * 1024, // 16 MB
        mimes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
    },
    video: {
        maxSize: 16 * 1024 * 1024, // 16 MB
        mimes: ['video/mp4', 'video/3gpp'],
    },
    document: {
        maxSize: 100 * 1024 * 1024, // 100 MB
        mimes: [
            'application/pdf',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            'text/plain',
            'application/zip',
        ],
    },
    sticker: {
        maxSize: 100 * 1024, // 100 KB
        mimes: ['image/webp'],
    },
};

export function validateWhatsappFile(file: Express.Multer.File) {
    if (!file) return false;

    const rules = Object.values(WHATSAPP_MEDIA_RULES).find((rule) => rule.mimes.includes(file.mimetype));

    // if (!rules) {
    //     throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`);
    // }

    // if (file.size > rules.maxSize) {
    //     throw new BadRequestException(
    //         `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo permitido: ${
    //             rules.maxSize / 1024 / 1024
    //         } MB`,
    //     );
    // }

    return true;
}

export function validateWhatsappMimeType(mimetype: string) {
    const rules = Object.values(WHATSAPP_MEDIA_RULES).find((rule) => rule.mimes.includes(mimetype));

    // if (!rules) {
    //     throw new BadRequestException(`Tipo de arquivo não permitido: ${mimetype}`);
    // }

    return true;
}

export default function whatsappFileFilter(
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
) {
    try {
        validateWhatsappMimeType(file.mimetype);
        callback(null, true);
    } catch (err) {
        callback(new BadRequestException(err.message), false);
    }
}
