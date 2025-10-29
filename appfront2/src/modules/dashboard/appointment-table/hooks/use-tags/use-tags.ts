import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchTags = useCallback(async () => {
    try {
      setFetchTagsError(undefined);
      setIsFetchingTags(true);
      const response = await getTagsByWorkspaceId(workspaceId, queryString);
      setTags(response);
      setIsFetchingTags(false);
      return true;
    } catch (err) {
      setFetchTagsError(err as ApiError);
      notifyError(err);
      setIsFetchingTags(false);
      return false;
    }
  }, [queryString, workspaceId]);

  return {
    tags,
    isFetchingTags,
    fetchTagsError,
    fetchTags,
  };
};
