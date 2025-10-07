import { Flow } from '~/interfaces/flow';

export interface FlowSaveButtonProps {
  selectedFlow?: Flow;
  isSaveEnabled: boolean;
  isLoading: boolean;
}
