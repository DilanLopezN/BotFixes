import type { User } from '~/interfaces/user';

export interface UserUpdatePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userData: User | undefined;
}

export interface ModalUpdateUserFormValues {
  password: string;
  passwordConfirmation: string;
}
