import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { UserPlanLimit } from '~/interfaces/user-plan-limit';
import { checkPlanUserLimitByWorkspace } from '~/services/workspace/check-plan-user-limit-by-workspace';
import { notifyError } from '~/utils/notify-error';

export const useGetPlanUserByWorkspace = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [messageUserLimit, setMessageUserLimit] = useState<UserPlanLimit>({
    planUserLimit: 1,
    userCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const getPlanUserLimit = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await checkPlanUserLimitByWorkspace(workspaceId);
      if (!response) return;
      setMessageUserLimit({ planUserLimit: response.planUserLimit, userCount: response.userCount });
    } catch (err) {
      setError(err as ApiError);
      notifyError(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    getPlanUserLimit();
  }, [getPlanUserLimit]);

  return { messageUserLimit, isLoading, error, getPlanUserLimit };
};
