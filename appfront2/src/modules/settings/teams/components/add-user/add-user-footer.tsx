import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { AddUserSteps } from '../../constants';
import type { AddUserFooterProps } from './interfaces';

export const AddUserFooter = ({
  userListWithPermissions,
  selectedRowKeys,
  onClose,
  setCurrentStep,
  setSelectedUserIdListToAddPermissions,
  setTeamUserList,
  setShouldOnlyAddPermissions,
}: AddUserFooterProps) => {
  const { t } = useTranslation();
  const { addUserToTable } = localeKeys.settings.teams.components;
  const isAddPermissionsToMultipleUsersDisabled = selectedRowKeys.length < 1;

  const handleAddPermissionsToMultipleUsers = () => {
    setSelectedUserIdListToAddPermissions(selectedRowKeys);
    setShouldOnlyAddPermissions(true);
    setCurrentStep(AddUserSteps.AddPermissions);
  };

  const handleAddUser = () => {
    setTeamUserList((currentUserList) => {
      const newTeamUsers = selectedRowKeys.reduce<TeamUser[]>((previousValue, currentValue) => {
        const selectedUserWithPermissions = userListWithPermissions.find(
          (userWithPermission) => userWithPermission.userId === currentValue
        );
        if (selectedUserWithPermissions) {
          return [...previousValue, selectedUserWithPermissions];
        }

        return [
          ...previousValue,
          {
            userId: currentValue,
            isSupervisor: false,
            permission: {
              canStartConversation: false,
              canViewFinishedConversations: false,
              canViewOpenTeamConversations: false,
              canViewConversationContent: false,
              canTransferConversations: false,
              canSendAudioMessage: false,
              canSendOfficialTemplate: false,
              canViewHistoricConversation: false,

              // TODO: Permissão a ser adicionada no futuro
              canSendMultipleMessages: false,
            },
          },
        ];
      }, []);

      return [...currentUserList, ...newTeamUsers];
    });
    onClose();
  };

  return (
    <>
      <Button onClick={onClose}>{t(addUserToTable.close)}</Button>
      <Button
        onClick={handleAddPermissionsToMultipleUsers}
        disabled={isAddPermissionsToMultipleUsersDisabled}
      >
        {t(addUserToTable.addUserWithPermissions)}
      </Button>
      <Button type='primary' htmlType='button' onClick={handleAddUser}>
        {t(addUserToTable.addUser)}
      </Button>
    </>
  );
};
