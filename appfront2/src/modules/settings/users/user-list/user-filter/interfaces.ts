import { UserFilterType } from '~/constants/user-filter-type';

export interface UserFilterProps {
  selectedFilter: UserFilterType;
  setSelectedFilter: (value: UserFilterType) => void;
  setSearchInputValue: (value: string) => void;
  searchInputValue: string;
}
