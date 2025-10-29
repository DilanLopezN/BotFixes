import { ExportType } from '~/components/export-button';
import { UserFilterType } from '~/constants/user-filter-type';

export interface ExportUsersParams {
  workspaceId: string;
  status: UserFilterType;
  downloadType: ExportType;
  search?: string;
}
