import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import {
  FeedbackFilter,
  GetRatingsResponse,
  RatingDashboardQueryStrings,
} from '~/modules/dashboard/rating-dashboard/interfaces';
import { getRatings } from '~/services/rating/get-ratings';
import { notifyError } from '~/utils/notify-error';

export const useRatings = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<RatingDashboardQueryStrings>();
  const { t } = useTranslation();
  const ratingLocaleKeys = localeKeys.dashboard.ratingDashboard.hooks.useRatings;

  const [ratings, setRatings] = useState<GetRatingsResponse>();
  const [isFetchingRatings, setIsFetchingRatings] = useState(true);
  const [fetchRatingsError, setFetchRatingsError] = useState<ApiError>();

  const fetchRatings = useCallback(async () => {
    if (!queryStringAsObj.startDate || !queryStringAsObj.endDate) {
      setIsFetchingRatings(false);
      return;
    }

    try {
      setFetchRatingsError(undefined);
      setIsFetchingRatings(true);

      const limitedPageSize = Number(queryStringAsObj.pageSize || 10);
      const currentPage = Number(queryStringAsObj.currentPage || 1);
      const offset = Math.max(currentPage - 1, 0) * limitedPageSize;

      const params = new URLSearchParams();
      params.set('limit', limitedPageSize.toString());
      params.set('offset', offset.toString());
      params.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

      params.set(
        'startDate',
        dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss')
      );
      params.set(
        'endDate',
        dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss')
      );

      if (queryStringAsObj.memberId) params.set('memberId', queryStringAsObj.memberId);
      if (queryStringAsObj.teamIds) params.set('teamIds', queryStringAsObj.teamIds);
      if (queryStringAsObj.tags) params.set('tags', queryStringAsObj.tags);
      if (queryStringAsObj.feedback)
        params.set('feedback', queryStringAsObj.feedback as FeedbackFilter);
      if (queryStringAsObj.note) params.set('value', String(queryStringAsObj.note));

      const result = await getRatings(workspaceId, params.toString());
      setRatings(result);
    } catch (error) {
      notifyError(t(ratingLocaleKeys.fetchError));
      setFetchRatingsError(error as ApiError);
    } finally {
      setIsFetchingRatings(false);
    }
  }, [queryStringAsObj, workspaceId, t, ratingLocaleKeys.fetchError]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    ratings,
    isFetchingRatings,
    fetchRatingsError,
  };
};
