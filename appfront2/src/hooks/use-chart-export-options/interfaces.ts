import { ExportOption } from '~/modules/dashboard/sending-list/constants';

export interface UseChartExportOptionsParams {
  enableExport?: boolean;
  exportOptions?: ExportOption[];
  filename?: string;
}
