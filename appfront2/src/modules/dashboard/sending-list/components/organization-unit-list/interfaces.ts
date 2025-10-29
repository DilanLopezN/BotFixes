export interface UnitCategoryListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedOrganizationUnitList: string[];
  setSelectedOrganizationUnitList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
