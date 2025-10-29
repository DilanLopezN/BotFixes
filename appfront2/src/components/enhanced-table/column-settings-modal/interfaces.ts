import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { ColumnType } from 'antd/es/table';
import type { Dispatch, SetStateAction } from 'react';

export interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkboxOptions: CheckboxValueType[];
  setCheckboxOptions: Dispatch<SetStateAction<CheckboxValueType[]>>;
  columns: ColumnType<any>[];
  localStorageKey: string;
}
