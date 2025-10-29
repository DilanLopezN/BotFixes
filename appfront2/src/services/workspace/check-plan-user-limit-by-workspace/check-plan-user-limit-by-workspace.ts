import type { UserPlanLimit } from '~/interfaces/user-plan-limit';
import { apiInstance, doRequest } from '~/services/api-instance';

export const checkPlanUserLimitByWorkspace = async (workspaceId: string): Promise<UserPlanLimit> =>
  doRequest(apiInstance.post(`/users/checkUserCount/workspace/${workspaceId}`));
