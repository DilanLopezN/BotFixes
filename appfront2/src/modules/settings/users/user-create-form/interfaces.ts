import { UserRole } from '~/constants/user-roles';

export interface UserCreateFormValues {
  name: string;
  erpUsername?: string;
  email: string;
  permission: UserRole;
  password: string;
  passwordConfirmation: string;
}
