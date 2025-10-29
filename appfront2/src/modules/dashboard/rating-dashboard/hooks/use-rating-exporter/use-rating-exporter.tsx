import { notification } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { exportRatings } from '~/services/rating/export-ratings/export-ratings';
import { ExportRatingsRequest } from '~/services/rating/export-ratings/interfaces';
import { downloadBlobFile } from '~/utils/download-blob-file';
import { RatingDashboardQueryStrings } from '../../interfaces';

export const useRatingExporter = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<RatingDashboardQueryStrings>();
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const hookLocaleKeys = localeKeys.dashboard.ratingDashboard.hooks.useRatingCsv;

  const downloadFile = async (downloadType: 'csv' | 'xlsx') => {
    const { startDate, endDate, note, ...rest } = queryStringAsObj;

    if (!startDate || !endDate) {
      notification.warning({
        message: t(hookLocaleKeys.dateRangeWarningTitle),
        description: t(hookLocaleKeys.dateRangeWarningMessageRequired),
      });
      return;
    }

    if (dayjs(endDate).diff(dayjs(startDate), 'day') > 90) {
      notification.warning({
        message: t(hookLocaleKeys.dateRangeWarningTitle),
        description: t(hookLocaleKeys.dateRangeWarningMessage90days),
      });
      return;
    }

    setIsDownloading(true);
    try {
      const filters: ExportRatingsRequest = {
        ...rest,
        startDate: dayjs(startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        endDate: dayjs(endDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        downloadType,
        value: note ? Number(note) : undefined,
      };

      const blob = await exportRatings(workspaceId, filters);

      const now = dayjs().format('DD-MM-YYYY_HH-mm');
      downloadBlobFile(blob, `relatorio-avaliacao_${now}.${downloadType}`);
    } catch (error) {
      notification.error({
        message: t(hookLocaleKeys.downloadError),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    downloadFile,
  };
};
