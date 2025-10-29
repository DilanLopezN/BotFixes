export interface AutomaticBreakModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface AutomaticBreakFormValues {
  enabled?: boolean;
  notificationIntervalSeconds?: number;
  breakStartDelaySeconds?: number;
  maxInactiveDurationSeconds?: number;
}
