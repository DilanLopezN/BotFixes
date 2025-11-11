import { doRequest, apiInstance } from '../../../utils/Http';
import { Constants } from '../../../utils/Constants';

export const uploadFileTypes = {
    avi: 'video/x-msvideo',
    mp4: 'video/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    audioMpeg: 'audio/mpeg',
    doc: 'application/msword',
    pdf: 'application/pdf',
    cardVideo: 'application/vnd.microsoft.card.video',
    word: 'application/msword',
    excel: 'application/vnd.ms-excel',
    powerpoint: 'application/vnd.ms-powerpoint',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

interface MediaRule {
    maxSize: number;
    mimes: string[];
    name: string;
}

const WHATSAPP_MEDIA_RULES: Record<string, MediaRule> = {
    image: {
        name: 'Imagem',
        maxSize: 5 * 1024 * 1024,
        mimes: ['image/jpeg', 'image/png'],
    },
    audio: {
        name: 'Áudio',
        maxSize: 16 * 1024 * 1024,
        mimes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
    },
    video: {
        name: 'Vídeo',
        maxSize: 16 * 1024 * 1024,
        mimes: ['video/mp4', 'video/3gpp'],
    },
    document: {
        name: 'Documento',
        maxSize: 100 * 1024 * 1024,
        mimes: [
            'application/pdf',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
        ],
    },
    sticker: {
        name: 'Sticker',
        maxSize: 100 * 1024,
        mimes: ['image/webp'],
    },
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const generateAcceptedTypesMessage = (): string => {
    const categories = [
        'Imagem: JPEG, PNG (máx. 5MB)',
        'Áudio: AAC, MP4, MPEG, AMR, OGG (máx. 16MB)',
        'Vídeo: MP4, 3GPP (máx. 16MB)',
        'Documento: PDF, DOC, XLS, PPT, TXT, ZIP (máx. 100MB)',
        'Sticker: WEBP (máx. 100KB)',
    ];
    return `Tipos aceitos: ${categories.map((cat) => `• ${cat},`)}`;
};

export function validateWhatsappFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
        return { isValid: false, error: 'Nenhum arquivo foi selecionado.' };
    }

    if (file.size === 0) {
        return {
            isValid: false,
            error: 'O arquivo está vazio. Por favor, selecione um arquivo válido.',
        };
    }

    const fileType = file.type.split(';')[0].trim();

    // const rules = Object.values(WHATSAPP_MEDIA_RULES).find((rule) => rule.mimes.includes(fileType));
    const rules = { maxSize: 100 * 1024 * 1024, name: file.type };

    if (!rules) {
        return {
            isValid: false,
            error: `Tipo de arquivo ${fileType} não é suportado pelo WhatsApp. ${generateAcceptedTypesMessage()}`,
        };
    }

    if (file.size > rules.maxSize) {
        const currentSize = formatFileSize(file.size);
        const maxSize = formatFileSize(rules.maxSize);

        return {
            isValid: false,
            error: `${rules.name} muito grande! Tamanho atual: ${currentSize} Tamanho máximo: ${maxSize}. Por favor, escolha um arquivo menor ou comprima o arquivo.`,
        };
    }

    return { isValid: true };
}

export function validateWhatsappMimeType(mimetype: string): { isValid: boolean; error?: string } {
    if (!mimetype) {
        return {
            isValid: false,
            error: 'Tipo de arquivo não pode ser identificado.',
        };
    }

    const rules = Object.values(WHATSAPP_MEDIA_RULES).find((rule) => rule.mimes.includes(mimetype));

    if (!rules) {
        return {
            isValid: false,
            error: `Tipo ${mimetype} não é suportado pelo WhatsApp.\n${generateAcceptedTypesMessage()}`,
        };
    }

    return { isValid: true };
}

export function getFileInfo(file: File): { type: string; rule: MediaRule; size: string; usage: number } | null {
    const rules = Object.entries(WHATSAPP_MEDIA_RULES).find(([, rule]) => rule.mimes.includes(file.type));

    if (!rules) return null;

    const [type, rule] = rules;
    const usage = Math.round((file.size / rule.maxSize) * 100);

    return {
        type,
        rule,
        size: formatFileSize(file.size),
        usage,
    };
}

export const AttachmentService = {
    getAllowedFileTypes: () => Object.values(uploadFileTypes),
    isImageFile: (mime: string) => mime.toLowerCase().includes('image/', 0),
    isVideoFile: (mime: string) => mime.toLowerCase().includes('video/', 0),
    isAudioFile: (mime: string) => mime.toLowerCase().includes('audio/', 0),
    isPdfFile: (mime: string) => mime.toLowerCase() === 'application/pdf',
    isPreviewableFile: (mime: string) => AttachmentService.isImageFile(mime) || AttachmentService.isPdfFile(mime),
    createAttachmentUrl: (conversationId: string, attachmentId: string, cache?: boolean) => {
        const timestamp = cache ? +new Date() : '0'; //query utilizada para evitar cache da request pelo app
        return `${Constants.API_URL}/conversations/${conversationId}/attachments/${attachmentId}/view?timestamp=${timestamp}`;
    },
    getIconByMimeType: (mime: string) => {
        switch (mime) {
            case uploadFileTypes.png:
            case uploadFileTypes.jpg:
            case uploadFileTypes.jpeg:
            case uploadFileTypes.gif:
                return 'file-image';

            case uploadFileTypes.avi:
            case uploadFileTypes.mp4:
            case uploadFileTypes.cardVideo:
                return 'file-video';

            case uploadFileTypes.mp3:
            case uploadFileTypes.audioMpeg:
            case uploadFileTypes.ogg:
                return 'headphones';

            case uploadFileTypes.doc:
            case uploadFileTypes.docx:
            case uploadFileTypes.word:
                return 'file-word';

            case uploadFileTypes.pdf:
                return 'file-pdf';

            default:
                return 'file-document';
        }
    },
    sendAttachment: async (conversationId, memberId, formData) => {
        return await doRequest(
            apiInstance.post(`/conversations/${conversationId}/members/${memberId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000,
            })
        );
    },

    sendAttachmentBatch: async (conversationId: string, memberId: string, formData: FormData) => {
        return await doRequest(
            apiInstance.post(`/conversations/${conversationId}/members/${memberId}/attachments/batch`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 120000, // 2min
            })
        );
    },
    updateAttachment: async (conversationId, attachmentId, body) => {
        return await doRequest(apiInstance.put(`/conversations/${conversationId}/attachments/${attachmentId}`, body));
    },
    viewAttachment: async (conversationId: string, attachmentId: string, viewed?: boolean): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/conversations/${conversationId}/attachments/${attachmentId}/view`, { viewed: !!viewed })
        );
    },
    sendFileTemplate: async (
        workspaceId: string,
        conversationId: string,
        sendFileTemplate: {
            templateId: string;
            memberId: string;
            message?: string;
            attributes?: string[];
            quoted?: string | null;
        },
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversations/${conversationId}/send-file-template`,
                sendFileTemplate
            ),
            false,
            errCb
        );
    },
};
