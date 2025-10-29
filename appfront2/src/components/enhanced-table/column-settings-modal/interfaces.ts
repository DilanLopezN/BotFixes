import type { ColumnType } from 'antd/es/table';
import type { CheckboxGroupProps } from 'antd/lib/checkbox';
import type { Dispatch, SetStateAction } from 'react';

export interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkboxOptions: CheckboxGroupProps['value'];
  setCheckboxOptions: Dispatch<SetStateAction<CheckboxGroupProps['value']>>;
  columns: ColumnType<any>[];
  localStorageKey: string;
}
