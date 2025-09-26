import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Flex, Input, Popconfirm, Space, Tag } from 'antd';
import type { ColumnType, TableProps } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { avatarBackgroundColorList } from '~/components/avatar-list/constants';
import { EnhancedTable } from '~/components/enhanced-table';
import { UserTeamPermission } from '~/constants/user-team-permissions';
import { useWindowSize } from '~/hooks/use-window-size';
import { localeKeys } from '~/i18n';
import type { TeamUser } from '~/interfaces/team';
import { capitalizeText } from '~/utils/capitalize-text';
import { useActiveUsers } from '../../hooks/use-active-users';
import { AddUserModal } from '../add-user-modal';
import { EditPermissionModal } from '../edit-permission-modal';
import type { SortOrder, UserTableProps } from './interfaces';
import { Container } from './styles';

export const UserTable = ({ teamUserList, isTeamInactive, setTeamUserList }: UserTableProps) => {
  const { t } = useTranslation();
  const { teamTable } = localeKeys.settings.teams.components;
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditUserPermissionsVisible, setIsEditUserPermissionsVisible] = useState(false);
  const [selectedUserIdListToAddPermissions, setSelectedUserIdListToAddPermissions] = useState<
    string[]
  >([]);
  const [shouldOnlyAddPermissions, setShouldOnlyAddPermissions] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState('');
  const { data: paginatedActiveUsers, isLoading, fetchActiveUsers } = useActiveUsers();
  const [sortOrder, setSortOrder] = useState<SortOrder>('ascend');
  const { width } = useWindowSize();

  const userList = useMemo(() => paginatedActiveUsers?.data || [], [paginatedActiveUsers?.data]);

  const hasTeamUsersSelected = selectedRowKeys.length >= 1;

  const filteredTeamUserList = useMemo(() => {
    return teamUserList.filter((teamUser) => {
      const selectedUser = userList.find((user) => user._id === teamUser.userId);

      if (!selectedUser) {
        return false;
      }

      const normalizedUserName = selectedUser.name.trim().toLowerCase();
      const normalizedSearchInputValue = searchInputValue.trim().toLowerCase();
      return normalizedUserName.includes(normalizedSearchInputValue);
    });
  }, [searchInputValue, teamUserList, userList]);

  const handleOpenAddUserModal = () => {
    setIsAddUserModalVisible(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalVisible(false);
    setSelectedUserIdListToAddPermissions([]);
  };

  const handleCloseEditUserPermissionsModal = () => {
    setIsEditUserPermissionsVisible(false);
  };

  const handleAddPermissionsToMultipleUsers = () => {
    setShouldOnlyAddPermissions(true);
    setSelectedUserIdListToAddPermissions(selectedRowKeys);
    setIsEditUserPermissionsVisible(true);
  };

  const handleDeleteTeamUser = (teamUserIdList: string[]) => {
    setTeamUserList((currentTeamUserList) => {
      return currentTeamUserList.filter(
        (teamUser) => !teamUserIdList.some((teamUserId) => teamUser.userId === teamUserId)
      );
    });
  };

  const handleDeleteMultipleTeamUsers = () => {
    handleDeleteTeamUser(selectedRowKeys);
    setSelectedRowKeys([]);
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

  const handlePreventSubmitWhenPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const handleChangeTable: NonNullable<TableProps<TeamUser>['onChange']> = (
    pagination,
    filters,
    sorter
  ) => {
    setSortOrder((sorter as any).order as SortOrder);
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  const columns: ColumnType<TeamUser>[] = [
    {
      title: t(teamTable.nameCard),
      dataIndex: 'name',
      key: 'name',
      sortOrder,
      sorter: (userA, userB) => {
        const selectedUserA =
          paginatedActiveUsers?.data.find(
            (userWithPermission) => userWithPermission._id === userA.userId
          )?.name || '';
        const selectedUserB =
          paginatedActiveUsers?.data.find(
            (userWithPermission) => userWithPermission._id === userB.userId
          )?.name || '';
        return selectedUserA.localeCompare(selectedUserB);
      },
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (_, teamUser, index) => {
        const selectedUser = paginatedActiveUsers?.data.find(
          (userWithPermission) => userWithPermission._id === teamUser.userId
        );

        if (!selectedUser) {
          return '';
        }

        const backgroundColor = avatarBackgroundColorList[index % avatarBackgroundColorList.length];
        return (
          <Space>
            <Avatar
              src={selectedUser.avatar}
              style={{
                backgroundColor: selectedUser.avatar ? undefined : backgroundColor,
              }}
            >
              {selectedUser.name ? capitalizeText(selectedUser.name[0]) : ''}
            </Avatar>
            <span>{selectedUser.name}</span>
          </Space>
        );
      },
    },
    {
      title: '',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 140,
      render: (_, user) => {
        if (user.isSupervisor) {
          return <Tag>{t(teamTable.supervisor)}</Tag>;
        }

        if (user.permission.canViewHistoricConversation) {
          return <Tag>{t(teamTable.onePermission)}</Tag>;
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
            (permission) => user.permission[permission as keyof typeof user.permission]
          ).length + 1;

        return permissionCount ? (
          <Tag>
            {permissionCount > 1
              ? t(teamTable.multiplePermissions).replace('{count}', permissionCount.toString())
              : t(teamTable.onePermissionSingular).replace('{count}', permissionCount.toString())}
          </Tag>
        ) : (
          ''
        );
      },
    },
    {
      title: '',
      width: 300,
      key: 'action',
      align: 'right',
      render: (_, teamUser) => (
        <Space>
          <Button
            icon={<EditOutlined style={{ color: '#faad14' }} />}
            disabled={isTeamInactive}
            onClick={(event) => {
              event.stopPropagation();
              setShouldOnlyAddPermissions(false);
              setSelectedUserIdListToAddPermissions([teamUser.userId]);
              setIsEditUserPermissionsVisible(true);
            }}
          >
            {t(teamTable.editPermissions)}
          </Button>
          <Popconfirm
            title={t(teamTable.deleteUserConfirm)}
            okText={t(teamTable.delete)}
            cancelText={t(teamTable.no)}
            onConfirm={(event) => {
              if (event) {
                event.stopPropagation();
              }

              handleDeleteTeamUser([teamUser.userId]);
              setSelectedRowKeys((currentRowKeys) => {
                return currentRowKeys.filter((rowKey) => rowKey !== teamUser.userId);
              });
            }}
            onCancel={(event) => {
              if (event) {
                event.stopPropagation();
              }
            }}
          >
            <Button
              icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
              disabled={isTeamInactive}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {t(teamTable.delete)}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Card
        title={
          <Flex justify='space-between'>
            <Flex style={{ gap: 16, marginRight: 16 }} flex={1}>
              <span>{t(teamTable.users)}</span>
              <Input.Search
                allowClear
                value={searchInputValue}
                onChange={(event) => {
                  setSearchInputValue(event.target.value);
                }}
                onKeyDown={handlePreventSubmitWhenPressEnter}
                placeholder={t(teamTable.searchPlaceholder)}
                style={{ maxWidth: 500 }}
              />
            </Flex>
            <Space>
              <Popconfirm
                title={t(teamTable.deleteSelectedUsersConfirm)}
                okText={t(teamTable.delete)}
                cancelText={t(teamTable.no)}
                onConfirm={handleDeleteMultipleTeamUsers}
              >
                <Button disabled={!hasTeamUsersSelected || isTeamInactive}>
                  {t(teamTable.deleteSelected)}
                </Button>
              </Popconfirm>
              <Button
                onClick={handleAddPermissionsToMultipleUsers}
                disabled={!hasTeamUsersSelected || isTeamInactive}
              >
                {t(teamTable.batchAddPermissions)}
              </Button>
              <Button
                onClick={handleOpenAddUserModal}
                disabled={isTeamInactive}
                icon={<PlusOutlined style={{ color: '#52c41a' }} />}
              >
                {t(teamTable.addUser)}
              </Button>
            </Space>
          </Flex>
        }
      >
        <EnhancedTable
          rowKey={(row) => row.userId}
          columns={columns}
          dataSource={filteredTeamUserList}
          loading={isLoading}
          onChange={handleChangeTable}
          rowSelection={
            !isTeamInactive
              ? {
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (newSelectedRowKeys) => {
                    setSelectedRowKeys(newSelectedRowKeys as string[]);
                  },
                  preserveSelectedRowKeys: true,
                }
              : undefined
          }
          onRow={(record) => {
            return {
              onClick: () => {
                handleRowClick(record.userId);
              },
            };
          }}
          scroll={{ y: 'calc(100vh - 584px)', x: width < 1400 ? 950 : undefined }}
          minHeight='300px'
        />
        <AddUserModal
          userList={userList}
          isLoadingUserList={isLoading}
          isVisible={isAddUserModalVisible}
          onClose={handleCloseAddUserModal}
          addedUsers={teamUserList}
          setTeamUserList={setTeamUserList}
        />
        <EditPermissionModal
          isVisible={isEditUserPermissionsVisible}
          selectedUserIdListToAddPermissions={selectedUserIdListToAddPermissions}
          shouldOnlyAddPermissions={shouldOnlyAddPermissions}
          userList={userList}
          teamUserList={teamUserList}
          onClose={handleCloseEditUserPermissionsModal}
          setTeamUserList={setTeamUserList}
          setSelectedUserIdListToAddPermissions={setSelectedUserIdListToAddPermissions}
        />
      </Card>
    </Container>
  );
};
