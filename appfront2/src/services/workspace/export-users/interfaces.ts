import { UserFilterType } from '~/constants/user-filter-type';
import { TypeDownloadEnum } from '../export-list-schedules-csv/type-download-enum';

export interface ExportUsersParams {
  workspaceId: string;
  status: UserFilterType;
  downloadType: TypeDownloadEnum;
  search?: string;
}
