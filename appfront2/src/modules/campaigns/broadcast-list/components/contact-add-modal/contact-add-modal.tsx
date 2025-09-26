import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload';
import { isEmpty } from 'lodash';
import { useMemo, useState } from 'react';
import { localeKeys } from '~/i18n';
import { extractTemplateKeys } from '~/utils/extract-template-keys';
import { notifyError } from '~/utils/notify-error';
import { readXlsxFile } from '~/utils/read-xlsx-file';
import { ColumnSetupContainer } from './column-setup-container';
import { ContactAddModalSteps } from './constants';
import type { ContactAddModalProps, SheetData } from './interfaces';
import { XlsxImportContainer } from './xlsx-import-container';

export const ContactAddModal = ({
  isVisible,
  maxContactCount,
  availableCount,
  selectedTemplate,
  onClose,
  setDataSource,
}: ContactAddModalProps) => {
  const [step, setStep] = useState(ContactAddModalSteps.ImportFile);
  const [xlsxFile, setXlsxFile] = useState<SheetData[][]>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { t } = useTranslation();

  const contactAddModalLocaleKeys =
    localeKeys.campaign.broadcastList.components.contactAddModal.contactAddModal;

  const staticColumns = [
    { label: t(contactAddModalLocaleKeys.labelStaticColumnsFone), value: 'phone' },
    { label: t(contactAddModalLocaleKeys.labelStaticColumnsName), value: 'name' },
  ];

  const variables = useMemo(() => {
    return extractTemplateKeys(selectedTemplate?.message);
  }, [selectedTemplate?.message]);

  const dynamicColumns =
    variables.map((variable) => {
      return { label: variable, value: variable };
    }) || [];
  const columns = [...staticColumns, ...dynamicColumns];

  const handleFileRead = (file: RcFile) => {
    readXlsxFile(file, (sheet) => {
      setXlsxFile(sheet);
    });
    return false;
  };

  const handleImportFile = () => {
    const xlsxContactCount = xlsxFile ? xlsxFile.length - 1 : 0;

    if (xlsxContactCount > availableCount) {
      Modal.confirm({
        title: t(contactAddModalLocaleKeys.titleModalConfirmLimit, { maxContactCount }),
        content: t(contactAddModalLocaleKeys.modalConfirmContent),
        okText: t(contactAddModalLocaleKeys.okTextContinue),
        cancelText: t(contactAddModalLocaleKeys.cancelText),
        centered: true,
        onOk: () => {
          setStep(ContactAddModalSteps.SetUpColumns);
        },
      });
      return;
    }
    if (!xlsxFile || isEmpty(fileList)) {
      notifyError(t(contactAddModalLocaleKeys.notifyErrorXlsxFile));
      return;
    }

    if (fileList.some((file) => file.error)) {
      notifyError(t(contactAddModalLocaleKeys.notifyErrorFile));
      return;
    }

    setStep(ContactAddModalSteps.SetUpColumns);
  };

  const handleAfterClose = () => {
    setXlsxFile(undefined);
    setFileList([]);
    setStep(ContactAddModalSteps.ImportFile);
  };

  const renderHeader = () => {
    if (step === ContactAddModalSteps.ImportFile) {
      return <span>{t(contactAddModalLocaleKeys.spanImportFile)}</span>;
    }

    return <span>{t(contactAddModalLocaleKeys.spanImportFileConfig)}</span>;
  };

  const renderBody = () => {
    if (step === ContactAddModalSteps.ImportFile) {
      return (
        <XlsxImportContainer
          columns={columns}
          handleFileRead={handleFileRead}
          fileList={fileList}
          setFileList={setFileList}
        />
      );
    }

    return (
      <ColumnSetupContainer
        xlsxFile={xlsxFile}
        columns={columns}
        maxContactCount={maxContactCount}
        setDataSource={setDataSource}
        onClose={onClose}
      />
    );
  };

  const renderFooter = () => {
    return (
      <>
        <Button onClick={onClose}>{t(contactAddModalLocaleKeys.buttonCancel)}</Button>
        <Button
          type='primary'
          htmlType='button'
          onClick={handleImportFile}
          style={{ display: step === ContactAddModalSteps.ImportFile ? 'initial' : 'none' }}
        >
          {t(contactAddModalLocaleKeys.buttonImportData)}
        </Button>
        <Button
          type='primary'
          htmlType='submit'
          form='setup-columns-form'
          style={{ display: step === ContactAddModalSteps.SetUpColumns ? 'initial' : 'none' }}
        >
          {t(contactAddModalLocaleKeys.buttonAddRecipients)}
        </Button>
      </>
    );
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      title={renderHeader()}
      footer={renderFooter()}
      width={1000}
      styles={{ body: { height: 'calc(100vh - 250px)' } }}
      maskClosable={false}
      keyboard={false}
      afterClose={handleAfterClose}
    >
      {renderBody()}
    </Modal>
  );
};
