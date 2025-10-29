import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { User } from '~/interfaces/user';
import { getUsersById } from '~/services/workspace/get-user-by-id';
import { notifyError } from '~/utils/notify-error';

export const useUserById = () => {
  const { workspaceId = '', userId = '' } = useParams<{ workspaceId: string; userId: string }>();
  const [data, setData] = useState<User>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await getUsersById({ workspaceId, userId });
        setData(response);
      } catch (err) {
        notifyError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, workspaceId]);

  return { data, isLoading };
};
