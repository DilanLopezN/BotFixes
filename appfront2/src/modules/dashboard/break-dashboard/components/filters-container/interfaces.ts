export interface FilterModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface FilterFormValues {
  userId?: string;
  teamId?: string;
  breakSettingId?: number;
}
