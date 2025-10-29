import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { Tag } from '~/interfaces/tag';
import { createTagWorkspace } from '~/services/workspace/create-tag';
import type { CreateTagData } from './interfaces';

export const useCreateTag = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createTag = useCallback(
    async (tagData: CreateTagData): Promise<Tag | false> => {
      setError(undefined);
      setIsCreating(true);

      try {
        const newTag = await createTagWorkspace(workspaceId, tagData);
        setIsCreating(false);
        return newTag;
      } catch (err) {
        setError(err as ApiError);
        setIsCreating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return {
    createTag,
    isCreating,
    error,
  };
};
