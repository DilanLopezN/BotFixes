export interface FiltersContainerProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export interface FilterModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface FilterFormValues {
  remiIdList?: string[];
}
