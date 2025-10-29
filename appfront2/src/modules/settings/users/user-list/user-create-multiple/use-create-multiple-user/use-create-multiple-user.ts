import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { loadMultipleUsersToSave } from '~/services/workspace/load-multiple-users-to-save';

export const useCreateMultipleUser = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const uploadXlsxFile = async (files: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', files as Blob);
      setIsCreating(true);
      await loadMultipleUsersToSave(workspaceId, formData);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsCreating(false);
    }
  };

  return { uploadXlsxFile, isCreating, error };
};
