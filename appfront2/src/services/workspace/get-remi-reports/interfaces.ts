export interface GetRemiReportsProps {
  startDate?: string;
  endDate?: string;
  remiIdList?: string[];
}

export interface GetRemiReportsResponse {
  totalRemiActivation: number;
  totalAnsweredOnFirstAttempt: number;
  totalAnsweredOnSecondAttempt: number;
  totalFinishedByRemi: number;
  totalRemiConversion: number;
  totalRengagedConversation: number;
  totalRemiConversations: number;
}
