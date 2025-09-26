import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PermissionResources } from '~/constants/permission-resources';
import { updateUsersById } from '~/services/workspace/update-user-by-id';
import { UserPermission } from '~/interfaces/user-permission';
import { UserUpdateFormProps } from '../interfaces';
import { useUserById } from '../use-user-by-id';

export const useUserUpdater = () => {
  const { data } = useUserById();
  const { workspaceId = '', userId = '' } = useParams<{ workspaceId: string; userId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUser = useCallback(
    async (userData: UserUpdateFormProps) => {
      try {
        setIsUpdating(true);
        if (!data) return;

        const newSubRoles: UserPermission[] = userData?.subRoles?.map((role) => {
          return {
            resource: PermissionResources.WORKSPACE,
            role: role!,
            resourceId: workspaceId,
          };
        });

        const userUpdate = {
          name: userData.name,
          role: {
            resource: PermissionResources.WORKSPACE,
            resourceId: workspaceId,
            role: userData.permission,
          },
          subRoles: newSubRoles || [],
        };
        await updateUsersById(workspaceId, userId, userUpdate);
      } catch (err) {
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [data, userId, workspaceId]
  );

  return { isUpdating, updateUser };
};
