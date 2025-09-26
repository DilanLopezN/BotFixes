import { Form, type GetRef, type TableProps } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { CampaignStatus } from '~/constants/campaign-status';
import type { TemplateMessage } from '~/interfaces/template-message';

export interface ContactTableProps {
  selectedTemplate?: TemplateMessage;
  dataSource: any[];
  filteredDataSource: any[];
  setDataSource: Dispatch<SetStateAction<any[]>>;
  selectedRowKeys: string[];
  setSelectedRowKeys: Dispatch<SetStateAction<string[]>>;
  canEdit?: boolean;
  broadcastStatus?: CampaignStatus;
  duplicatedPhones: string[];
}

export interface EditableRowProps {
  index: number;
}

export type FormInstance<T> = GetRef<typeof Form<T>>;

export interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: string;
  record: any;
  handleSave: (record: any) => void;
  children: React.ReactNode;
  hasDuplicatedPhone: boolean;
  immediateStart?: boolean;
}

export type ColumnTypes = Exclude<TableProps['columns'], undefined>;

export type Columns = (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[];
