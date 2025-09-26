import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PermissionResources } from '~/constants/permission-resources';
import { ApiError } from '~/interfaces/api-error';
import { Me } from '~/interfaces/me';
import { updateRoles } from '~/services/workspace/update-roles';
import { UserCreateFormValues } from '../interfaces';

export const useUpdateRole = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const updateUserRole = async (selectedUser: Me, values: UserCreateFormValues) => {
    try {
      setIsUpdating(true);
      const { _id } = selectedUser;
      const userUpdateRole = {
        resource: PermissionResources.WORKSPACE,
        resourceId: workspaceId,
        role: values.permission,
      };

      await updateRoles(workspaceId, _id, userUpdateRole);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUserRole, error, isUpdating };
};
