import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import {
  getTagsByWorkspaceId,
  type GetTagsByWorkspaceIdResponse,
} from '~/services/workspace/get-tags-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';
import type { TagsListParams } from './interfaces';

export const useGetTags = ({ currentPage, pageSize, search }: TagsListParams = {}) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [tags, setTags] = useState<GetTagsByWorkspaceIdResponse>();
  const [isFetchingTags, setIsFetchingTags] = useState(true);
  const [fetchTagsError, setFetchTagsError] = useState<ApiError>();

  const { t } = useTranslation();

  const useTagsLocaleKeys = localeKeys.dashboard.categorizationDashboard.hooks.useTags;

  const queryString = useMemo(() => {
    if (!pageSize || !currentPage) {
      return '';
    }

    const limitedPageSize = Math.min(pageSize, 100);

    const qString = createQueryString({
      limit: limitedPageSize,
      skip: Math.max(currentPage - 1, 0) * limitedPageSize,
      search,
      sort: 'name',
    });
    return qString;
  }, [currentPage, pageSize, search]);

  const fetchTags = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setFetchTagsError(undefined);
      setIsFetchingTags(true);
      const response = await getTagsByWorkspaceId(workspaceId, queryString);
      setTags(response);
      setIsFetchingTags(false);
      return true;
    } catch (error) {
      notifyError({
        message: t(useTagsLocaleKeys.notifyErrorMessage),
        description: t(useTagsLocaleKeys.notifyErrorDescription),
      });
      setFetchTagsError(error as ApiError);
      setIsFetchingTags(false);
      return false;
    }
  }, [
    queryString,
    t,
    useTagsLocaleKeys.notifyErrorDescription,
    useTagsLocaleKeys.notifyErrorMessage,
    workspaceId,
  ]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isFetchingTags,
    fetchTagsError,
    fetchTags,
  };
};
