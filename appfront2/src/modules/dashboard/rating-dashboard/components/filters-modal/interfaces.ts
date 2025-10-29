export interface FiltersModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export interface FilterFormValues {
  memberId?: string;

  teamIds?: string[];

  tags?: string[];

  note?: string;

  feedback?: 'all' | 'withFeedback' | 'noFeedback';
}
