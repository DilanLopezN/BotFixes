export interface FiltersModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface FilterFormValues {
  objectiveIds?: number[];
  outcomeIds?: number[];
  conversationTags?: string[];
  userIds?: string[];
  teamIds?: string[];
}
