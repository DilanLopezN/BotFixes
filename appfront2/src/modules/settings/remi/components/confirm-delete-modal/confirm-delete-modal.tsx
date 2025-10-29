import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { ConfirmDeleteModalProps } from './interfaces';

export const ConfirmDeleteModal = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  remiName,
}: ConfirmDeleteModalProps) => {
  const { t } = useTranslation();
  const { confirmDeleteModal: keys } = localeKeys.settings.remi.components;

  return (
    <Modal
      title={t(keys.title)}
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      okText={t(keys.okText)}
      cancelText={t(keys.cancelText)}
      okButtonProps={{ danger: true }}
    >
      <p>
        {t(keys.confirmMessage)} <strong>{remiName}</strong>?
      </p>
      <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
        {t(keys.warningMessage)}
      </p>
    </Modal>
  );
};
