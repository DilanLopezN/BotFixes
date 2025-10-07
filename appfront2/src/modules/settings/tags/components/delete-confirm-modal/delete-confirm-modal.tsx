import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { DeleteConfirmModalProps } from './interfaces';

export const DeleteConfirmModal = ({
  visible,
  tagName,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  const deleteConfirmModalLocaleKeys = localeKeys.settings.tags.components.deleteConfirmModal;
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <Space align='center' size={8}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />
          {t(deleteConfirmModalLocaleKeys.deleteConfirmTitle)}
        </Space>
      }
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t(deleteConfirmModalLocaleKeys.deleteConfirmOkText)}
      cancelText={t(deleteConfirmModalLocaleKeys.deleteConfirmCancelText)}
      okButtonProps={{ loading, danger: true }}
      centered
      width={400}
      maskClosable={false}
      keyboard={false}
    >
      <Space direction='vertical' size='small' style={{ padding: '8px 0' }}>
        <Typography.Paragraph>
          {t(deleteConfirmModalLocaleKeys.deleteConfirmMessage, { tagName })}
        </Typography.Paragraph>
        <Typography.Text type='secondary' style={{ marginTop: 8 }}>
          {t(deleteConfirmModalLocaleKeys.deleteConfirmWarning)}
        </Typography.Text>
      </Space>
    </Modal>
  );
};
