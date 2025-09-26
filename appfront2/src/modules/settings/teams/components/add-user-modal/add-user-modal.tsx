import { Alert, Button, Modal } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { AddUserSteps } from '../../constants';
import { AddUser } from '../add-user';
import { AddUserPermission } from '../add-user-permission';
import { PermissionListRef } from '../permission-list';
import type { AddUserModalProps } from './interfaces';

export const AddUserModal = ({
  isVisible,
  userList,
  isLoadingUserList,
  addedUsers,
  onClose,
  setTeamUserList,
}: AddUserModalProps) => {
  const { t } = useTranslation();
  const { addUserModal } = localeKeys.settings.teams.components;
  const permissionListRef = useRef<PermissionListRef>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<AddUserSteps>(AddUserSteps.AddUsers);
  const [selectedUserIdListToAddPermissions, setSelectedUserIdListToAddPermissions] = useState<
    string[]
  >([]);
  const [userListWithPermissions, setUserListWithPermissions] = useState<TeamUser[]>([]);
  const [shouldOnlyAddPermissions, setShouldOnlyAddPermissions] = useState(true);

  const filteredUserList = useMemo(() => {
    return userList.filter(
      (user) => !addedUsers.some((addedUser) => addedUser.userId === user._id)
    );
  }, [addedUsers, userList]);

  const hasAvailableUserToAdd = filteredUserList.length > 0;

  const handleAfterClose = () => {
    setSelectedRowKeys([]);
    setCurrentStep(AddUserSteps.AddUsers);
    setSelectedUserIdListToAddPermissions([]);
    setUserListWithPermissions([]);
    permissionListRef.current?.resetValues();
  };

  const renderModalHeader = () => {
    if (currentStep === AddUserSteps.AddUsers) {
      return <AddUser.Header />;
    }

    // currentStep === Steps.AddPermission
    return <AddUserPermission.Header />;
  };

  const renderModalFooter = () => {
    if (!hasAvailableUserToAdd) {
      return <Button onClick={onClose}>{t(addUserModal.close)}</Button>;
    }

    if (currentStep === AddUserSteps.AddUsers) {
      return (
        <AddUser.Footer
          userListWithPermissions={userListWithPermissions}
          selectedRowKeys={selectedRowKeys}
          onClose={onClose}
          setCurrentStep={setCurrentStep}
          setSelectedUserIdListToAddPermissions={setSelectedUserIdListToAddPermissions}
          setTeamUserList={setTeamUserList}
          setShouldOnlyAddPermissions={setShouldOnlyAddPermissions}
        />
      );
    }

    // currentStep === Steps.AddPermission
    return (
      <AddUserPermission.Footer
        permissionListRef={permissionListRef}
        selectedUserIdListToAddPermissions={selectedUserIdListToAddPermissions}
        onClose={onClose}
        shouldOnlyAddPermissions={shouldOnlyAddPermissions}
        setSelectedRowKeys={setSelectedRowKeys}
        setTeamUserList={setTeamUserList}
        setUserListWithPermissions={setUserListWithPermissions}
        setCurrentStep={setCurrentStep}
        setSelectedUserIdListToAddPermissions={setSelectedUserIdListToAddPermissions}
      />
    );
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      title={renderModalHeader()}
      width={800}
      keyboard={false}
      maskClosable={false}
      closable={!hasAvailableUserToAdd}
      forceRender
      styles={{ body: { height: '60vh' } }}
      footer={renderModalFooter}
      afterClose={handleAfterClose}
    >
      <div style={{ display: !hasAvailableUserToAdd ? 'inherit' : 'none' }}>
        <Alert
          message={t(addUserModal.noAvailableUsers)}
          description={t(addUserModal.noAvailableUsersDescription)}
          type='warning'
          showIcon
        />
      </div>
      <div
        style={{
          display:
            currentStep === AddUserSteps.AddUsers && hasAvailableUserToAdd ? 'inherit' : 'none',
        }}
      >
        <AddUser
          userList={filteredUserList}
          userListWithPermissions={userListWithPermissions}
          isLoadingUserList={isLoadingUserList}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          setCurrentStep={setCurrentStep}
          setSelectedUserIdListToAddPermissions={setSelectedUserIdListToAddPermissions}
          setShouldOnlyAddPermissions={setShouldOnlyAddPermissions}
        />
      </div>
      <div
        style={{
          display:
            currentStep === AddUserSteps.AddPermissions && hasAvailableUserToAdd
              ? 'inherit'
              : 'none',
        }}
      >
        <AddUserPermission
          permissionListRef={permissionListRef}
          userList={filteredUserList}
          userListWithPermissions={userListWithPermissions}
          selectedUserIdListToAddPermissions={selectedUserIdListToAddPermissions}
          shouldOnlyAddPermissions={shouldOnlyAddPermissions}
        />
      </div>
    </Modal>
  );
};
