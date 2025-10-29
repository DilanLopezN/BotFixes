import { Alert, Modal, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useInactivateTeam } from '../../hooks/use-inactivate-team';
import type { InactivateTeamModalProps } from './interfaces';

export const InactivateTeamModal = ({
  team,
  isVisible,
  onClose,
  getTeamById,
}: InactivateTeamModalProps) => {
  const { t } = useTranslation();
  const { inactivateTeamModal } = localeKeys.settings.teams.components;
  const { isInactivating, inactivateTeam } = useInactivateTeam();

  const handleClose = () => {
    if (isInactivating) return;

    onClose();
  };

  const handleInactivateTeam = async () => {
    if (!team?._id || isInactivating) return;

    const result = await inactivateTeam(team._id);

    if (!result) {
      notifyError(t(inactivateTeamModal.errorNotificationMessage));
      return;
    }

    onClose();
    notifySuccess({
      message: t(inactivateTeamModal.successNotificationMessage),
      description: t(inactivateTeamModal.successNotificationDescription),
    });
    getTeamById();
  };

  return (
    <Modal
      open={isVisible}
      title={t(inactivateTeamModal.title)}
      width={520}
      maskClosable={false}
      onOk={handleInactivateTeam}
      okButtonProps={{ loading: isInactivating }}
      okText={t(inactivateTeamModal.okButton)}
      onCancel={handleClose}
      cancelButtonProps={{ disabled: isInactivating }}
      cancelText={t(inactivateTeamModal.cancelButton)}
    >
      <Space direction='vertical'>
        <Alert type='warning' description={t(inactivateTeamModal.description.descriptionAlert)} />
        <span>
          {t(inactivateTeamModal.description.descriptionSpan)}

          <Tooltip title={t(inactivateTeamModal.tooltipMessage)}>
            <Link to='https://botdesigner.tawk.help/article/como-inativar-time' target='_blank'>
              <span style={{ marginLeft: 3 }}>
                {t(inactivateTeamModal.description.descriptionArticle)}
              </span>
            </Link>
          </Tooltip>
        </span>
      </Space>
    </Modal>
  );
};
