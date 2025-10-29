import { Avatar, Button, Col, Input, Row, Space, Tag } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { avatarBackgroundColorList } from '~/components/avatar-list/constants';
import { EnhancedTable } from '~/components/enhanced-table';
import { UserTeamPermission } from '~/constants/user-team-permissions';
import { localeKeys } from '~/i18n';
import type { User } from '~/interfaces/user';
import { capitalizeText } from '~/utils/capitalize-text';
import { AddUserSteps } from '../../constants';
import { AddUserFooter } from './add-user-footer';
import { AddUserHeader } from './add-user-header';
import type { UserTableProps } from './interfaces';
import { Container } from './styles';

export const AddUser = ({
  userList,
  userListWithPermissions,
  isLoadingUserList,
  selectedRowKeys,
  setSelectedRowKeys,
  setCurrentStep,
  setSelectedUserIdListToAddPermissions,
  setShouldOnlyAddPermissions,
}: UserTableProps) => {
  const { t } = useTranslation();
  const { addUserToTable } = localeKeys.settings.teams.components;

  const [searchInputValue, setSearchInputValue] = useState('');

  const filteredUserList = useMemo(() => {
    return userList.filter((user) => {
      const normalizedUserName = user.name.trim().toLowerCase();
      const normalizedSearchInputValue = searchInputValue.trim().toLowerCase();
      return normalizedUserName.includes(normalizedSearchInputValue);
    });
  }, [searchInputValue, userList]);

  const handleGoToAddPermission = (userId: string) => {
    setCurrentStep(AddUserSteps.AddPermissions);
    setShouldOnlyAddPermissions(false);
    setSelectedUserIdListToAddPermissions([userId]);
  };

  const handleRowClick = (recordKey: string) => {
    let newSelectedRowKeys = [];

    const rowKeyIndex = selectedRowKeys.findIndex((rowKey) => rowKey === recordKey);

    if (rowKeyIndex >= 0) {
      newSelectedRowKeys = selectedRowKeys.filter((rowKey) => rowKey !== recordKey);
    } else {
      newSelectedRowKeys = [...selectedRowKeys, recordKey];
    }

    setSelectedRowKeys(newSelectedRowKeys);
  };

  const columns: ColumnType<User>[] = [
    {
      title: t(addUserToTable.nameCard),
      dataIndex: 'name',
      key: 'name',
      render: (_, user, index) => {
        const backgroundColor = avatarBackgroundColorList[index % avatarBackgroundColorList.length];
        return (
          <Space>
            <Avatar
              src={user.avatar}
              style={{ backgroundColor: user.avatar ? undefined : backgroundColor }}
            >
              {user.name ? capitalizeText(user.name[0]) : ''}
            </Avatar>
            <span>{user.name}</span>
          </Space>
        );
      },
    },
    {
      title: '',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 140,
      align: 'right',
      render: (_, user) => {
        const selectedUserWithPermissions = userListWithPermissions.find(
          (userWithPermission) => userWithPermission.userId === user._id
        );

        if (!selectedUserWithPermissions) {
          return '';
        }

        if (selectedUserWithPermissions.isSupervisor) {
          return <Tag>{t(addUserToTable.supervisor)}</Tag>;
        }

        if (selectedUserWithPermissions.permission.canViewHistoricConversation) {
          return <Tag>{t(addUserToTable.onePermission)}</Tag>;
        }

        const permissionArray = [
          UserTeamPermission.canSendAudioMessage,
          UserTeamPermission.canSendMultipleMessages,
          UserTeamPermission.canSendOfficialTemplate,
          UserTeamPermission.canStartConversation,
          UserTeamPermission.canTransferConversations,
          UserTeamPermission.canViewConversationContent,
          UserTeamPermission.canViewFinishedConversations,
          UserTeamPermission.canViewOpenTeamConversations,
        ];
        const permissionCount =
          permissionArray.filter(
            (permission) =>
              selectedUserWithPermissions.permission[
                permission as keyof typeof selectedUserWithPermissions.permission
              ]
          ).length + 1;

        return permissionCount ? (
          <Tag>
            {permissionCount > 1
              ? t(addUserToTable.multiplePermissions).replace('{count}', permissionCount.toString())
              : t(addUserToTable.onePermission)}
          </Tag>
        ) : (
          ''
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              handleGoToAddPermission(record._id);
            }}
          >
            {t(addUserToTable.editPermissions)}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <span>{t(addUserToTable.availableUsersTitle)}</span>
        </Col>
        <Col span={24}>
          <Input.Search
            allowClear
            placeholder={t(addUserToTable.searchPlaceholder)}
            value={searchInputValue}
            onChange={(event) => {
              setSearchInputValue(event.target.value);
            }}
          />
        </Col>
        <Col span={24}>
          <EnhancedTable
            loading={isLoadingUserList}
            dataSource={filteredUserList}
            columns={columns}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (newSelectedRowKeys) => {
                setSelectedRowKeys(newSelectedRowKeys as string[]);
              },
              preserveSelectedRowKeys: true,
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  handleRowClick(record._id);
                },
              };
            }}
            scroll={{
              y: 'calc(60vh - 148px)',
            }}
          />
        </Col>
      </Row>
    </Container>
  );
};
AddUser.Header = AddUserHeader;
AddUser.Footer = AddUserFooter;
