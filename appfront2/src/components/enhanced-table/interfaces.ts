import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type EnhancedTableProps = TableProps<any> & {
  id?: string;
  minHeight?: string;
  addExtraPaddingIfEmpty?: boolean;
  shouldAlwaysAddHeight?: boolean;
};

export interface EnhancedTableRef {
  openColumnConfig: () => void;
  getVisibleColumns: () => ColumnsType<any>;
}
