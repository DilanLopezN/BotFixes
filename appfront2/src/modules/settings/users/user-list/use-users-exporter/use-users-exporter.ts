import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ExportType } from '~/components/export-button';
import { UserFilterType } from '~/constants/user-filter-type';
import { localeKeys } from '~/i18n';
import { exportUsers } from '~/services/workspace/export-users';
import { downloadFile } from '~/utils/download-file';
import { notifyError } from '~/utils/notify-error';

export const useUsersExporter = () => {
  const { t } = useTranslation();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isExporting, setIsExporting] = useState(false);

  const onExport = useCallback(
    async (downloadType: ExportType, filter: UserFilterType, search?: string) => {
      if (isExporting) return;
      const status = filter || UserFilterType.All;
      try {
        setIsExporting(true);
        const blob = await exportUsers({ workspaceId, status, downloadType, search });

        const isCsv = downloadType === ExportType.Csv;
        const fileName = `workspace-users.${isCsv ? 'csv' : 'xlsx'}`;
        const fileType = isCsv
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        downloadFile(blob, fileName, fileType);
      } catch (error) {
        const { userList } = localeKeys.settings.users;
        notifyError(t(userList.exporter.error));
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, t, workspaceId]
  );

  return { onExport, isExporting };
};
