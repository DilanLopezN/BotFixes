import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { Tag } from '~/interfaces/tag';
import { updateTagWorkspace } from '~/services/workspace/update-tag';

export const useUpdateTag = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<ApiError>();

  const updateTag = useCallback(
    async (tagData: Tag): Promise<Tag | false> => {
      setUpdateError(undefined);
      setIsUpdating(true);

      try {
        const updatedTag = await updateTagWorkspace(workspaceId, tagData);
        setIsUpdating(false);
        return updatedTag;
      } catch (err) {
        setUpdateError(err as ApiError);
        setIsUpdating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return {
    isUpdating,
    updateError,
    updateTag,
  };
};
