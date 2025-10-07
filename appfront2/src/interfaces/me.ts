import { UserPermission } from './user-permission';

export interface Me {
  _id: string;
  name: string;
  email: string;
  timezone: string;
  loginMethod: string;
  cognitoUniqueId: string;
  roles: UserPermission[];
  language: string;
  passwordExpires: number;
  createdAt: string;
  updatedAt: string;
  password?: string;
}
