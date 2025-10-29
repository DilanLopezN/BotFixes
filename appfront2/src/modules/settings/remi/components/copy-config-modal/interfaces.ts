export interface CopyConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (targetRemiId: string) => void;
  loading: boolean;
  targetOptions: Array<{ label: string; value: string }>;
}
