import { FlowCategoryEnum } from '~/constants/flow-category';

export interface FiltersModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface FlowCategory {
  id: number;
  category: FlowCategoryEnum;
}

export interface FiltersFormValues {
  categoriesIds?: number[];
  channelStatus?: string[];
}
