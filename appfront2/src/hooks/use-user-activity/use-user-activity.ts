import { useContext } from 'react';
import { UserActivityContext } from '~/contexts/user-activity-context';

export const useUserActivity = () => useContext(UserActivityContext);
