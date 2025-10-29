import { ConversationCardData } from './../ConversationCard/props';
import { FileAttachment } from '../../interfaces/conversation.interface';
export interface PreviewImageProps {
    modalImage: {
        opened: boolean,
        fileAttachment?: FileAttachment,
    };
    closeModal: Function;
    conversation: ConversationCardData;
}