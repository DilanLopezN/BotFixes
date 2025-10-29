import { Button, Col, Modal, Row } from 'antd';
import _ from 'lodash';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { PermissionList, type PermissionListRef } from '../permission-list';
import type { EditPermissionModalProps } from './interfaces';

export const EditPermissionModal = ({
  userList,
  teamUserList,
  isVisible,
  selectedUserIdListToAddPermissions,
  shouldOnlyAddPermissions,
  onClose,
  setTeamUserList,
  setSelectedUserIdListToAddPermissions,
}: EditPermissionModalProps) => {
  const { t } = useTranslation();
  const { editPermissionModal } = localeKeys.settings.teams.components;
  const permissionListRef = useRef<PermissionListRef>(null);

  const permissionListInitialValues: TeamUser | undefined = useMemo(() => {
    if (shouldOnlyAddPermissions || teamUserList.length === 0) {
      return undefined;
    }

    const selectedUser = teamUserList.find(
      (teamUser) => teamUser.userId === selectedUserIdListToAddPermissions[0]
    );

    if (!selectedUser) {
      return undefined;
    }

    return selectedUser;
  }, [selectedUserIdListToAddPermissions, shouldOnlyAddPermissions, teamUserList]);

  const handleAfterClose = () => {
    permissionListRef.current?.resetValues();
    setSelectedUserIdListToAddPermissions([]);
  };

  const handleAddPermission = () => {
    if (!permissionListRef.current) return;

    const permissionList = permissionListRef.current.getCheckboxValues();

    setTeamUserList((teamUser) => {
      const newUserListWithPermissions = selectedUserIdListToAddPermissions.reduce<TeamUser[]>(
        (previousValue, currentValue) => {
          if (shouldOnlyAddPermissions) {
            const currentUser = teamUser.find((user) => user.userId === currentValue);
            if (currentUser) {
              const newCurrentUserPermissions = {
                userId: currentValue,
                isSupervisor: currentUser.isSupervisor || permissionList.isSupervisor,
                permission: {
                  canStartConversation:
                    currentUser.permission.canStartConversation ||
                    permissionList.canStartConversation,
                  canViewFinishedConversations:
                    currentUser.permission.canViewFinishedConversations ||
                    permissionList.canViewFinishedConversations,
                  canViewOpenTeamConversations:
                    currentUser.permission.canViewOpenTeamConversations ||
                    permissionList.canViewOpenTeamConversations,
                  canViewConversationContent:
                    currentUser.permission.canViewConversationContent ||
                    permissionList.canViewConversationContent,
                  canTransferConversations:
                    currentUser.permission.canTransferConversations ||
                    permissionList.canTransferConversations,
                  canSendAudioMessage:
                    currentUser.permission.canSendAudioMessage ||
                    permissionList.canSendAudioMessage,
                  canSendOfficialTemplate:
                    currentUser.permission.canSendOfficialTemplate ||
                    permissionList.canSendOfficialTemplate,
                  canViewHistoricConversation:
                    currentUser.permission.canViewHistoricConversation ||
                    permissionList.canViewHistoricConversation,

                  // TODO: Permissão a ser adicionada no futuro
                  canSendMultipleMessages: false,
                },
              };
              return [...previousValue, newCurrentUserPermissions];
            }
          }

          return [
            ...previousValue,
            {
              userId: currentValue,
              isSupervisor: permissionList.isSupervisor,
              permission: {
                canStartConversation: permissionList.canStartConversation,
                canViewFinishedConversations: permissionList.canViewFinishedConversations,
                canViewOpenTeamConversations: permissionList.canViewOpenTeamConversations,
                canViewConversationContent: permissionList.canViewConversationContent,
                canTransferConversations: permissionList.canTransferConversations,
                canSendAudioMessage: permissionList.canSendAudioMessage,
                canSendOfficialTemplate: permissionList.canSendOfficialTemplate,
                canViewHistoricConversation: permissionList.canViewHistoricConversation,

                // TODO: Permissão a ser adicionada no futuro
                canSendMultipleMessages: false,
              },
            },
          ];
        },
        []
      );
      return _.uniqBy([...newUserListWithPermissions, ...teamUser], 'userId');
    });

    onClose();
  };

  const renderModalDescription = () => {
    if (shouldOnlyAddPermissions) {
      const userCount = selectedUserIdListToAddPermissions.length;
      return (
        <span>
          {t(editPermissionModal.addingPermissions)}
          <b>
            {userCount} {t(editPermissionModal.addingPermissionsUsers)}
          </b>
        </span>
      );
    }

    const selectedUser = userList.find(
      (user) => user._id === selectedUserIdListToAddPermissions[0]
    );

    return (
      <span>
        {t(editPermissionModal.editingPermissions)} <b>{selectedUser?.name}</b>
      </span>
    );
  };

  const renderModalFooter = () => {
    return (
      <>
        <Button onClick={onClose}>{t(editPermissionModal.close)}</Button>
        <Button onClick={handleAddPermission} type='primary' htmlType='button'>
          {t(editPermissionModal.addPermissions)}
        </Button>
      </>
    );
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      title={t(editPermissionModal.title)}
      width={800}
      keyboard={false}
      maskClosable={false}
      closable={false}
      forceRender
      styles={{ body: { height: '60vh' } }}
      footer={renderModalFooter}
      afterClose={handleAfterClose}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>{renderModalDescription()}</Col>
        <Col span={24}>
          <PermissionList ref={permissionListRef} selectedUser={permissionListInitialValues} />
        </Col>
      </Row>
    </Modal>
  );
};
