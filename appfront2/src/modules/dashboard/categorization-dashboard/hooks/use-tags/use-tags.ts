import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import {
  getTagsByWorkspaceId,
  type GetTagsByWorkspaceIdResponse,
} from '~/services/workspace/get-tags-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';

export const useTags = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [tags, setTags] = useState<GetTagsByWorkspaceIdResponse>();
  const [isFetchingTags, setIsFetchingTags] = useState(true);
  const [fetchTagsError, setFetchTagsError] = useState<ApiError>();

  const { t } = useTranslation();

  const useTagsLocaleKeys = localeKeys.dashboard.categorizationDashboard.hooks.useTags;

  const fetchTags = useCallback(async () => {
    if (!workspaceId) return;

    const queryString = createQueryString({
      sort: '+inactive',
    });

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
