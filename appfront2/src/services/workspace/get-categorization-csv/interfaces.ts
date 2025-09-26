export interface GetCategorizationCsvProps {
  conversationCategorizationId?: number;
  objectiveIds?: string[];
  outcomeIds?: string[];
  conversationTags?: string[];
  userIds?: string[];
  teamIds?: string[];
  description?: string;
  startDate?: number;
  endDate?: number;
  downloadType?: 'CSV' | 'XLSX';
}
