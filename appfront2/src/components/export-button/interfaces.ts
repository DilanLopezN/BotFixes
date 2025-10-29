import type { ButtonProps } from 'antd';
import { ExportType } from './constants';

export type ExportButtonProps = { onDownload: (type: ExportType) => Promise<void> } & ButtonProps;
