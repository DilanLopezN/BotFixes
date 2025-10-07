import { WhatsappFlowLibrary } from '~/interfaces/flow-libraries';

export interface FlowLibrariesResponse {
  data: WhatsappFlowLibrary[];
}

export interface GetFlowLibrariesParams {
  search?: string;
  flowCategoryIds?: number[];
  channels?: string[];
  channelStatus?: string[];
}
