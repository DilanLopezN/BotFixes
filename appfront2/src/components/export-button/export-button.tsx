import { ExportOutlined } from '@ant-design/icons';
import { Button, Divider, Popover, Radio, type RadioChangeEvent, Row } from 'antd';
import { useState } from 'react';
import { ExportType } from './constants';
import { ExportButtonProps } from './interfaces';

export const ExportButton = ({
  onDownload,
  disabled,
  loading,
  ...restProps
}: ExportButtonProps) => {
  const [downloadType, setDownloadType] = useState<ExportType>(ExportType.Xlsx);
  const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOptionChange = (e: RadioChangeEvent) => {
    e.stopPropagation();
    setDownloadType(e.target.value);
  };

  const handleOpenPopover = () => {
    setPopoverVisible(true);
  };

  const handleCancel = () => {
    setDownloadType(ExportType.Empty);
    setPopoverVisible(false);
  };

  const handleDownload = async () => {
    if (downloadType) {
      setIsDownloading(true);
      await onDownload(downloadType);
      setIsDownloading(false);
    }
    setPopoverVisible(false);
  };

  const content = (
    <Radio.Group onChange={handleOptionChange} value={downloadType}>
      <Row style={{ marginTop: 10 }}>
        <Radio value='CSV'> CSV</Radio>
      </Row>
      <Row style={{ marginTop: 10 }}>
        <Radio value='XLSX'> XLSX (Excel)</Radio>
      </Row>
      <Divider />
      <Row>
        <Button type='link' onClick={handleCancel} disabled={isDownloading}>
          Cancelar
        </Button>
        <Button
          type='primary'
          onClick={handleDownload}
          disabled={!downloadType || disabled}
          loading={isDownloading}
        >
          Exportar
        </Button>
      </Row>
    </Radio.Group>
  );

  return (
    <Popover
      content={content}
      trigger='click'
      placement='bottomRight'
      open={popoverVisible || isDownloading}
    >
      <Button
        {...restProps}
        onClick={handleOpenPopover}
        icon={<ExportOutlined />}
        disabled={disabled || Boolean(loading)}
      >
        Exportar
      </Button>
    </Popover>
  );
};
