import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserTeamsById, UserTeam } from '~/services/workspace/get-user-teams-by-id';
import { notifyError } from '~/utils/notify-error';

export const useUserTeams = () => {
  const { workspaceId = '', userId = '' } = useParams<{ workspaceId: string; userId: string }>();
  const [data, setData] = useState<UserTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceId || !userId) return;

      try {
        setIsLoading(true);
        const response = await getUserTeamsById(workspaceId, userId);
        setData(response.data);
      } catch (err) {
        notifyError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, userId]);

  const refetch = async () => {
    if (!workspaceId || !userId) return;

    try {
      setIsLoading(true);
      const response = await getUserTeamsById(workspaceId, userId);
      setData(response.data);
    } catch (err) {
      notifyError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch };
};
