import type { RcFile, UploadFile } from 'antd/es/upload';
import type { Dispatch, SetStateAction } from 'react';
import type { TemplateMessage } from '~/interfaces/template-message';

export interface ContactAddModalProps {
  isVisible: boolean;
  selectedTemplate?: TemplateMessage;
  availableCount: number;
  maxContactCount: number;
  onClose: () => void;
  setDataSource: Dispatch<SetStateAction<any[]>>;
}

export interface ColumnConfig {
  label: string;
  value: string;
}

export interface XlsxImportContainerProps {
  columns: ColumnConfig[];
  handleFileRead: (file: RcFile) => void;
  fileList: UploadFile[];
  setFileList: Dispatch<SetStateAction<UploadFile[]>>;
}

export type SheetData = string;

export interface ColumnSetupContainerProps {
  columns: ColumnConfig[];
  xlsxFile?: SheetData[][];
  maxContactCount: number;
  setDataSource: Dispatch<SetStateAction<any[]>>;
  onClose: () => void;
}
