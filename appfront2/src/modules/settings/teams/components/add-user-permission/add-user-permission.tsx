import { Col, Row } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { PermissionList } from '../permission-list';
import { AddUserPermissionFooter } from './add-user-permission-footer';
import { AddUserPermissionHeader } from './add-user-permission-header';
import type { AddUserPermissionProps } from './interfaces';

export const AddUserPermission = ({
  permissionListRef,
  selectedUserIdListToAddPermissions,
  userListWithPermissions,
  userList,
  shouldOnlyAddPermissions,
}: AddUserPermissionProps) => {
  const { t } = useTranslation();
  const { addUserPermission } = localeKeys.settings.teams.components;

  const permissionListInitialValues: TeamUser | undefined = useMemo(() => {
    if (shouldOnlyAddPermissions || userListWithPermissions.length === 0) {
      return undefined;
    }

    const selectedUser = userListWithPermissions.find(
      (userWithPermissions) => userWithPermissions.userId === selectedUserIdListToAddPermissions[0]
    );

    if (!selectedUser) {
      return undefined;
    }

    return selectedUser;
  }, [selectedUserIdListToAddPermissions, shouldOnlyAddPermissions, userListWithPermissions]);

  const renderModalDescription = () => {
    if (shouldOnlyAddPermissions) {
      const userCount = selectedUserIdListToAddPermissions.length;
      return (
        <span>
          {t(addUserPermission.addingPermissions).replace('{count}', userCount.toString())}
        </span>
      );
    }

    const selectedUser = userList.find(
      (user) => user._id === selectedUserIdListToAddPermissions[0]
    );

    return (
      <span>
        {t(addUserPermission.editingPermissions)} <b>{selectedUser?.name}</b>
      </span>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>{renderModalDescription()}</Col>
      <Col span={24}>
        <PermissionList ref={permissionListRef} selectedUser={permissionListInitialValues} />
      </Col>
    </Row>
  );
};

AddUserPermission.Header = AddUserPermissionHeader;
AddUserPermission.Footer = AddUserPermissionFooter;
