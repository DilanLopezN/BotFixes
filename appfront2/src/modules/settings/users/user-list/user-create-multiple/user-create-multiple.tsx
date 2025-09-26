import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Space, Upload, UploadFile } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { downloadXlsxFile } from '~/utils/download-xlsx-file';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { UserCreateMultipleProps } from './interfaces';
import { useCreateMultipleUser } from './use-create-multiple-user';

export const UserCreateMultiple = (props: UserCreateMultipleProps) => {
  const { onClose, visible } = props;

  const { t } = useTranslation();
  const { userCreateMultiple } = localeKeys.settings.users.userList;
  const { uploadXlsxFile, isCreating, error } = useCreateMultipleUser();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [files, setFiles] = useState<any>(undefined);

  const downloadSampleFile = async () => {
    const columns = ['name', 'email'];
    downloadXlsxFile(`modelo-import-usuario.xlsx`, [columns]);
  };

  const onUploadFile = async () => {
    await uploadXlsxFile(files);
    notifySuccess({
      message: t(userCreateMultiple.success),
      description: t(userCreateMultiple.successImportSeveral),
    });
  };

  useEffect(() => {
    if (!error) return;

    notifyError(error);
  }, [error]);

  return (
    <Modal
      open={visible}
      title={t(userCreateMultiple.fileFormatWarning)}
      onCancel={() => {
        onClose();
      }}
      okText={t(userCreateMultiple.import)}
      cancelText={t(userCreateMultiple.back)}
      okButtonProps={{
        form: 'create-user-form',
        htmlType: 'submit',
        loading: isCreating,
        onClick: onUploadFile,
        disabled: !files,
      }}
    >
      <Space direction='vertical'>
        <Upload
          name='user-batch'
          multiple={false}
          customRequest={() => {}}
          beforeUpload={() => false}
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: true,
            showDownloadIcon: false,
          }}
          fileList={
            files
              ? [
                  {
                    name: files.name,
                    status: 'done',
                    size: 0,
                    type: '',
                    uid: '0',
                  },
                ]
              : []
          }
          supportServerRender
          accept='.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          onChange={({ file, fileList }) => {
            if (!fileList.length) {
              setFiles(undefined);
              setErrorMessage('');
              return;
            }
            const fileToUpload = file as UploadFile<any>;
            const maxSizeMB = 1;
            if (
              fileToUpload?.originFileObj &&
              fileToUpload?.originFileObj?.size > maxSizeMB * 1000000
            ) {
              setErrorMessage(t(userCreateMultiple.selectFileUp));
              return;
            }
            setErrorMessage('');
            if (fileToUpload) {
              setFiles(fileToUpload);
            } else {
              setFiles(undefined);
            }
          }}
        >
          <Button icon={<UploadOutlined />}>{t(userCreateMultiple.importFromFile)}</Button>
        </Upload>
        {errorMessage && <Alert message={errorMessage} type='error' showIcon />}
        <Button onClick={downloadSampleFile} size='small' type='link'>
          {t(userCreateMultiple.downloadModel)}
        </Button>
      </Space>
    </Modal>
  );
};
