import { ButtonProps } from 'antd';

export interface DownloadModalProps {
    onDownload: (type: string) => Promise<void>;
    isDownloadDisabled?: boolean;
    type?: ButtonProps['type'];
    isNotClosed?: boolean;
}

export enum typeDownloadEnum {
    CSV = 'CSV',
    XLSX = 'XLSX',
}
