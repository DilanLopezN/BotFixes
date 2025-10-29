import { InfoCircleOutlined } from '@ant-design/icons';
import { Modal, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useReactivateTeam } from '../../hooks/use-reactivate-team';
import type { ReactivateTeamModalProps } from './interfaces';

export const ReactivateTeamModal = ({
  team,
  isVisible,
  onClose,
  getTeamById,
}: ReactivateTeamModalProps) => {
  const { t } = useTranslation();
  const { reactivateTeamModal } = localeKeys.settings.teams.components;
  const { isReactivating, reactivateTeam } = useReactivateTeam();

  const handleClose = () => {
    if (isReactivating) return;

    onClose();
  };

  const handleInactivateTeam = async () => {
    if (!team?._id || isReactivating) return;

    const result = await reactivateTeam(team._id);

    if (!result) {
      notifyError(t(reactivateTeamModal.errorNotificationMessage));
      return;
    }

    onClose();
    notifySuccess({
      message: t(reactivateTeamModal.successNotificationMessage),
      description: t(reactivateTeamModal.successNotificationDescription),
    });
    getTeamById();
  };

  return (
    <Modal
      open={isVisible}
      title={t(reactivateTeamModal.title)}
      width={520}
      maskClosable={false}
      onOk={handleInactivateTeam}
      okButtonProps={{ loading: isReactivating }}
      okText={t(reactivateTeamModal.okButton)}
      onCancel={handleClose}
      cancelButtonProps={{ disabled: isReactivating }}
      cancelText={t(reactivateTeamModal.cancelButton)}
    >
      <Space direction='vertical'>
        <span>
          {t(reactivateTeamModal.description)}{' '}
          <Tooltip title={t(reactivateTeamModal.tooltipMessage)}>
            <Link to='https://botdesigner.tawk.help/article/como-inativar-time' target='_blank'>
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
            </Link>
          </Tooltip>
        </span>
      </Space>
    </Modal>
  );
};
