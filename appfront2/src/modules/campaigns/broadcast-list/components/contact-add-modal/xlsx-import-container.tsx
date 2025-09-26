import { useTranslation } from 'react-i18next';
import { InboxOutlined } from '@ant-design/icons';
import { Alert, Col, Row, Space, Upload, type UploadProps } from 'antd';
import { type MouseEventHandler } from 'react';
import { localeKeys } from '~/i18n';
import { downloadXlsxFile } from '~/utils/download-xlsx-file';
import type { XlsxImportContainerProps } from './interfaces';
import { DownloadLink } from './styles';

export const XlsxImportContainer = ({
  columns,
  handleFileRead,
  fileList,
  setFileList,
}: XlsxImportContainerProps) => {
  const handleDownloadSampleFile: MouseEventHandler<HTMLAnchorElement> = async (event) => {
    event.preventDefault();
    const columnNames = columns.map((column) => column.value);
    downloadXlsxFile(`modelo-destinatarios.xlsx`, [columnNames]);
  };

  const { t } = useTranslation();

  const xlsxImportContainerLocaleKeys =
    localeKeys.campaign.broadcastList.components.contactAddModal.xlsxImportContainer;

  const handleChangeFileList: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Alert
          message={t(xlsxImportContainerLocaleKeys.alertMessage, {
            columns: columns.map((column) => `“${column.label}”`).join(', '),
          })}
          type='warning'
          showIcon
        />
      </Col>
      <Col span={24}>
        <span>{t(xlsxImportContainerLocaleKeys.spanImport)}</span>
      </Col>
      <Col span={24} style={{ marginBottom: 24 }}>
        <Upload.Dragger
          name='contact-document'
          accept='.xlsx, .xls'
          fileList={fileList}
          onChange={handleChangeFileList}
          multiple={false}
          beforeUpload={handleFileRead}
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: false,
            showDownloadIcon: false,
          }}
          maxCount={1}
        >
          <p className='ant-upload-drag-icon'>
            <InboxOutlined />
          </p>
          <p className='ant-upload-text'>{t(xlsxImportContainerLocaleKeys.uploadDragger)}</p>
        </Upload.Dragger>
      </Col>
      <Col span={24}>
        <Space direction='vertical'>
          <span>{t(xlsxImportContainerLocaleKeys.spanDownloadTemplate)}</span>
          <DownloadLink href=' ' onClick={handleDownloadSampleFile}>
            {t(xlsxImportContainerLocaleKeys.downloadModel)}
          </DownloadLink>{' '}
        </Space>
      </Col>
    </Row>
  );
};
