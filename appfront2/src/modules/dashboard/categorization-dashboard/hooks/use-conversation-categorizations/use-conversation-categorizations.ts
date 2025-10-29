import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import {
  getConversationCategorizations,
  type GetConversationCategorizationResponse,
} from '~/services/workspace/get-conversation-categorizations';
import { notifyError } from '~/utils/notify-error';
import { FinishedConversationsDashboardQueryStrings } from '../../interfaces';

export const useConversationCategorizations = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<FinishedConversationsDashboardQueryStrings>();
  const [conversationCategorizations, setConversationCategorizations] =
    useState<NewResponseModel<GetConversationCategorizationResponse>>();
  const [isFetchingConversationCategorizations, setIsFetchingConversationCategorizations] =
    useState(true);
  const [fetchConversationCategorizationsError, setFetchConversationCategorizationsError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const conversationCategorizationsLocaleKeys =
    localeKeys.dashboard.categorizationDashboard.hooks.useConversationCategorizations;

  const fetchConversationCategorizations = useCallback(async () => {
    try {
      setFetchConversationCategorizationsError(undefined);
      setIsFetchingConversationCategorizations(true);

      const formattedStartDate = queryStringAsObj.startDate
        ? dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD').startOf('day').valueOf()
        : undefined;
      const formattedEndDate = queryStringAsObj.endDate
        ? dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD').endOf('day').valueOf()
        : undefined;
      const limitedPageSize = queryStringAsObj.pageSize
        ? Math.min(Number(queryStringAsObj.pageSize), 100)
        : 10;
      const currentPage = queryStringAsObj.currentPage ? Number(queryStringAsObj.currentPage) : 1;
      const userIds = queryStringAsObj.userIds?.split(',');
      const teamIds = queryStringAsObj.teamIds?.split(',');
      const objectiveIds = queryStringAsObj.objectiveIds?.split(',');
      const outcomeIds = queryStringAsObj.outcomeIds?.split(',');
      const conversationTags = queryStringAsObj.conversationTags?.split(',');

      const result = await getConversationCategorizations(workspaceId, {
        data: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          description: queryStringAsObj.search,
          userIds,
          teamIds,
          objectiveIds,
          outcomeIds,
          conversationTags,
        },

        limit: limitedPageSize,
        skip: Math.max(currentPage - 1, 0) * limitedPageSize,
      });
      setConversationCategorizations(result);
      setIsFetchingConversationCategorizations(false);
      return true;
    } catch (error) {
      notifyError(t(conversationCategorizationsLocaleKeys.reloadOutcomeError));
      setFetchConversationCategorizationsError(error as ApiError);
      setIsFetchingConversationCategorizations(false);
      return false;
    }
  }, [
    conversationCategorizationsLocaleKeys.reloadOutcomeError,
    queryStringAsObj.conversationTags,
    queryStringAsObj.currentPage,
    queryStringAsObj.endDate,
    queryStringAsObj.objectiveIds,
    queryStringAsObj.outcomeIds,
    queryStringAsObj.pageSize,
    queryStringAsObj.search,
    queryStringAsObj.startDate,
    queryStringAsObj.teamIds,
    queryStringAsObj.userIds,
    t,
    workspaceId,
  ]);

  useEffect(() => {
    fetchConversationCategorizations();
  }, [fetchConversationCategorizations]);

  return {
    fetchConversationCategorizations,
    conversationCategorizations,
    isFetchingConversationCategorizations,
    fetchConversationCategorizationsError,
  };
};
