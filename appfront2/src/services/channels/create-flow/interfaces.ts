export interface CreateFlowPayload {
  channelConfigId: string;
  flowLibraryId: number;
  flowData: Record<string, string>[];
}

export interface CreateFlowResponse {}
