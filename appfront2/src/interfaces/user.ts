import { LoginMethod } from '~/constants/login-method';
import { UserLanguage } from '~/constants/user-language';
import { UserPermission } from './user-permission';

export interface LiveAgentParams {
  notifications?: {
    emitSoundNotifications?: boolean;
    notificationNewAttendance?: boolean;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  loginMethod?: LoginMethod;
  cognitoUniqueId: string;
  timezone?: string;
  avatar?: string;
  language: UserLanguage;
  roles: UserPermission[];
  liveAgentParams?: LiveAgentParams;
  passwordExpires: number;
}
