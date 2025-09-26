import { UserRoles } from '~/constants/user-roles';

export interface UserCreateFormValues {
  name: string;
  email: string;
  permission: UserRoles;
  password: string;
  passwordConfirmation: string;
}
