export interface DeleteConfirmModalProps {
  visible: boolean;
  tagName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
