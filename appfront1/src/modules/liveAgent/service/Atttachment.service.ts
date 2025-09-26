import { doRequest, apiInstance } from '../../../utils/Http';
import { Constants } from '../../../utils/Constants';

export const uploadFileTypes = {
    avi: 'video/x-msvideo',
    mp4: 'video/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    mp3: 'audio/mp3',
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

export const AttachmentService = {
    getAllowedFileTypes: () => Object.values(uploadFileTypes),
    isImageFile: (mime: string) => mime.toLowerCase().includes('image/', 0),
    isVideoFile: (mime: string) => mime.toLowerCase().includes('video/', 0),
    isAudioFile: (mime: string) => mime.toLowerCase().includes('audio/', 0),
    isPdfFile: (mime: string) => mime.toLowerCase() === 'application/pdf',
    isPreviewableFile: (mime: string) => AttachmentService.isImageFile(mime) || AttachmentService.isPdfFile(mime),
    createAttachmentUrl: (conversationId: string, attachmentId: string, cache?: boolean) => {
        const timestamp = cache ? + new Date() : '0'; //query utilizada para evitar cache da request pelo app
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
        sendFileTemplate: { templateId: string; memberId: string; message?: string; attributes?: string[] ; quoted?:string | null },

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