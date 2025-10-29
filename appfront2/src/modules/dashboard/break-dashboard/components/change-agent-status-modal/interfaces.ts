import type { Dispatch, SetStateAction } from 'react';

export interface ChangeAgentStatusModalProps {
  isOpen: boolean;
  selectedBreak?: { value: number; label: string };
  selectedAgentIds?: string[];
  onClose: () => void;
  fetchAgentStatusList: () => void;
  setSelectedAgentIds: Dispatch<SetStateAction<string[]>>;
  setSelectedBreak: Dispatch<SetStateAction<{ value: number; label: string } | undefined>>;
}
