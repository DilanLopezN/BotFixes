export interface UserCreateMultipleProps {
  visible: boolean;
  onClose: () => void;
  fetchUserList: () => Promise<void>;
}
