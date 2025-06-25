import { typeDownloadEnum } from '../../../common/utils/downloadFileType';
import { GetConversationCategorizationParams } from './get-conversation-categorization.interface';

export interface GetConversationCategorizationCSVParams extends GetConversationCategorizationParams {
    downloadType?: typeDownloadEnum;
}
