import { FileAttachment } from '../modules/liveAgent/interfaces/conversation.interface';
import { AttachmentService } from '../modules/liveAgent/service/Atttachment.service';

export const downloadAllFiles = async (conversationId: string, fileAttachments: FileAttachment[], conversationIid: number) => {
    const fetchPromises: Promise<any>[] = [];

    for (const attachment of fileAttachments) {
        const attachmentUrl = AttachmentService.createAttachmentUrl(conversationId, attachment?._id as string);
        const url = `${attachmentUrl}?download=true`;
        const fetchPromise = fetch(url)
            .then((resp) => resp.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${conversationIid}_${attachment.name}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch((e) => console.log(e, 'download error'));

        fetchPromises.push(fetchPromise);
    }
    await Promise.all(fetchPromises);
};
