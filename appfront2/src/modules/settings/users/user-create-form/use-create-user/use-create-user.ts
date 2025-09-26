import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PermissionResources } from '~/constants/permission-resources';
import { UserLanguage } from '~/constants/user-language';
import type { ApiError } from '~/interfaces/api-error';
import { createUsersByWorkspace } from '~/services/workspace/create-user';
import { UserCreateFormValues } from '../interfaces';

export const useCreateUser = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createNewUser = async (values: UserCreateFormValues) => {
    try {
      setIsCreating(true);
      const newUser = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: {
          resource: PermissionResources.WORKSPACE,
          resourceId: workspaceId,
          role: values.permission,
        },
        language: UserLanguage.pt,
        passwordExpires: 0,
      };
      await createUsersByWorkspace(workspaceId, newUser);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createNewUser, error, isCreating };
};
