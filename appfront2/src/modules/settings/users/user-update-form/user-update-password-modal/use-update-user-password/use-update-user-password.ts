import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { updateUsersPassword } from '~/services/workspace/update-user-password';
import { notifyError } from '~/utils/notify-error';
import { ModalUpdateUserFormValues } from '../interfaces';

export const useUpateUserPassword = () => {
  const { workspaceId = '', userId = '' } = useParams<{ workspaceId: string; userId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError | undefined>();

  const updatePassword = async (formValues: ModalUpdateUserFormValues) => {
    try {
      setIsUpdating(true);
      await updateUsersPassword(workspaceId, userId, {
        password: formValues.password,
      });
    } catch (err) {
      setError(err as ApiError);
      notifyError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return { isUpdating, error, updatePassword };
};
