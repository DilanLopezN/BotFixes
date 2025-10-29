import { ReactNode } from 'react';
import type { ApiError } from '~/interfaces/api-error';
import type { UserActivity } from '~/interfaces/user-activity';

export interface UserActivityContextValues {
  userActivity?: UserActivity | { offline: boolean };
  isLoadingUserActivity: boolean;
  userActivityError?: ApiError;
  fetchUserActivity: () => void;
  setOffline: () => void;
}

export interface UserActivityProviderProps {
  children: ReactNode;
}
