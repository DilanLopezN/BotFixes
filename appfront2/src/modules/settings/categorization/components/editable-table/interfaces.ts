import { Form, type GetRef, type TableProps } from 'antd';
import type { Dispatch, SetStateAction } from 'react';

export interface EditableTableProps {
  dataSource: any[];
  isLoading?: boolean;
  selectedRowKeys: number[];
  setSelectedRowKeys: Dispatch<SetStateAction<number[]>>;
  onEditRow: (row: any) => Promise<void>;
  onRemoveRow: (row: any) => Promise<void>;
  onRestoreRow: (row: any) => Promise<void>;
}

export interface EditableRowProps {
  index: number;
}

export type FormInstance<T> = GetRef<typeof Form<T>>;

export interface EditableCellProps {
  title: React.ReactNode;
  isEditing: boolean;
  dataIndex: string;
  record: any;
  onEditRow: (row: any) => Promise<void>;
  onBlurInput: (row: any) => Promise<void>;
  children: React.ReactNode;
}

export type ColumnTypes = Exclude<TableProps['columns'], undefined>;

export type Columns = (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[];
