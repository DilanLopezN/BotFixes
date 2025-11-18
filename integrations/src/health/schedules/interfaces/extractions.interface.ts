enum ExtractionStatus {
  success = 1,
  pending = 0,
  error = -1,
}

interface IExtractions {
  id: number;
  integrationId: string;
  workspaceId: string;
  createdAt: number;
  extractStartedAt: number;
  extractEndedAt?: number;
  resultsCount?: number;
  status: ExtractionStatus;
  data: any;
}

export { ExtractionStatus, IExtractions };
