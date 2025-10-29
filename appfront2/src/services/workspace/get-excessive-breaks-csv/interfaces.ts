export interface GetExcessiveBreaksCsvProps {
  startDate?: string;
  endDate?: string;
  teamId?: string;
  userId?: string;
  breakSettingId?: number;
  downloadType?: 'CSV' | 'XLSX';
}
