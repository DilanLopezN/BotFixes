import { Button } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { AddUserSteps } from '../../constants';
import type { AddUserPermissionFooterProps } from './interfaces';

export const AddUserPermissionFooter = ({
  permissionListRef,
  shouldOnlyAddPermissions,
  selectedUserIdListToAddPermissions,
  onClose,
  setSelectedRowKeys,
  setCurrentStep,
  setTeamUserList,
  setUserListWithPermissions,
  setSelectedUserIdListToAddPermissions,
}: AddUserPermissionFooterProps) => {
  const { t } = useTranslation();
  const { addUserPermission } = localeKeys.settings.teams.components;
  const setTeamUsersFunction = shouldOnlyAddPermissions
    ? setTeamUserList
    : setUserListWithPermissions;

  const handleBack = () => {
    setSelectedUserIdListToAddPermissions([]);
    setCurrentStep(AddUserSteps.AddUsers);
    permissionListRef.current?.resetValues();
  };

  const handleAddPermission = () => {
    if (!permissionListRef.current) return;

    const permissionList = permissionListRef.current.getCheckboxValues();

    setTeamUsersFunction((userListWithPermissions) => {
      const newUserListWithPermissions = selectedUserIdListToAddPermissions.reduce<TeamUser[]>(
        (previousValue, currentValue) => {
          if (shouldOnlyAddPermissions) {
            const currentUser = userListWithPermissions.find(
              (user) => user.userId === currentValue
            );
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
      return _.uniqBy([...newUserListWithPermissions, ...userListWithPermissions], 'userId');
    });
    setSelectedRowKeys((currentSelectedRowKeys) => {
      return _.uniq([...currentSelectedRowKeys, ...selectedUserIdListToAddPermissions]);
    });
    setSelectedUserIdListToAddPermissions([]);
    setCurrentStep(AddUserSteps.AddUsers);

    if (shouldOnlyAddPermissions) {
      onClose();
    }
  };

  const renderPrimaryButtonDescription = () => {
    if (shouldOnlyAddPermissions) {
      return <span>{t(addUserPermission.addUsersWithSelectedPermissions)}</span>;
    }

    return <span>{t(addUserPermission.addPermissionForSelectedUser)}</span>;
  };

  return (
    <>
      <Button onClick={handleBack}>{t(addUserPermission.back)}</Button>
      <Button onClick={handleAddPermission} type='primary' htmlType='button'>
        {renderPrimaryButtonDescription()}
      </Button>
    </>
  );
};
