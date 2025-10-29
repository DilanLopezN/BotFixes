import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import { getCategorizationCsv } from '~/services/workspace/get-categorization-csv';
import { downloadFile } from '~/utils/download-file';
import { notifyError } from '~/utils/notify-error';
import { FinishedConversationsDashboardQueryStrings } from '../../interfaces';

export const useCategorizationCsv = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<FinishedConversationsDashboardQueryStrings>();
  const [isDownloadingCategorizationXlsx, setIsDownloadingCategorizationXlsx] = useState(false);
  const [downloadingCategorizationError, setDownloadingCategorizationError] = useState<ApiError>();

  const { t } = useTranslation();

  const useCategorizationCsvLocaleKeys =
    localeKeys.dashboard.categorizationDashboard.hooks.useCategorizationCsv;

  const downloadCategorizationCsv = useCallback(async () => {
    if (isDownloadingCategorizationXlsx) return;

    try {
      setDownloadingCategorizationError(undefined);
      setIsDownloadingCategorizationXlsx(true);

      const formattedStartDate = queryStringAsObj.startDate
        ? dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD').startOf('day').valueOf()
        : undefined;
      const formattedEndDate = queryStringAsObj.endDate
        ? dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD').endOf('day').valueOf()
        : undefined;
      const userIds = queryStringAsObj.userIds?.split(',');
      const teamIds = queryStringAsObj.teamIds?.split(',');
      const objectiveIds = queryStringAsObj.objectiveIds?.split(',');
      const outcomeIds = queryStringAsObj.outcomeIds?.split(',');
      const conversationTags = queryStringAsObj.conversationTags?.split(',');

      const response = await getCategorizationCsv(workspaceId, {
        data: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          description: queryStringAsObj.search,
          userIds,
          teamIds,
          objectiveIds,
          outcomeIds,
          conversationTags,
          downloadType: 'XLSX',
        },
      });
      downloadFile(
        response,
        'lista-de-desfechos.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      setIsDownloadingCategorizationXlsx(false);
      return true;
    } catch (error) {
      notifyError(t(useCategorizationCsvLocaleKeys.downloadingCategorizationError));
      setDownloadingCategorizationError(error as ApiError);
      setIsDownloadingCategorizationXlsx(false);
      return false;
    }
  }, [
    useCategorizationCsvLocaleKeys.downloadingCategorizationError,
    isDownloadingCategorizationXlsx,
    queryStringAsObj.conversationTags,
    queryStringAsObj.endDate,
    queryStringAsObj.objectiveIds,
    queryStringAsObj.outcomeIds,
    queryStringAsObj.search,
    queryStringAsObj.startDate,
    queryStringAsObj.teamIds,
    queryStringAsObj.userIds,
    t,
    workspaceId,
  ]);

  return {
    downloadCategorizationCsv,
    isDownloadingCategorizationCsv: isDownloadingCategorizationXlsx,
    downloadingCategorizationError,
  };
};
