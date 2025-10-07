import { DownloadOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Card, Dropdown, Space, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { UserFilterType } from '~/constants/user-filter-type';
import { UserRole } from '~/constants/user-roles';
import { useAuth } from '~/hooks/use-auth';
import { localeKeys } from '~/i18n';
import type { User } from '~/interfaces/user';
import { UserPermission } from '~/interfaces/user-permission';
import { routes } from '~/routes/constants';
import { TypeDownloadEnum } from '~/services/workspace/export-list-schedules-csv/type-download-enum';
import { normalizeText } from '~/utils/normalize-text';
import { isAnySystemAdmin } from '~/utils/permissions';
import { BodyContainer } from '../styles';
import { useGetPlanUserByWorkspace } from '../use-get-plan-user-by-workspace';
import {
  SpanCapitalize,
  StyledSummaryContainer,
  TableFiltersContainer,
  UserListContainer,
} from './styles';
import { useUserList } from './use-user-list';
import { useUsersExporter } from './use-users-exporter';
import { UserCreateMultiple } from './user-create-multiple';
import { UserFilter } from './user-filter';

const { Text } = Typography;

export const UserList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, fetchUserList } = useUserList();
  const { user: loggedUser } = useAuth();
  const { messageUserLimit, getPlanUserLimit } = useGetPlanUserByWorkspace();
  const [selectedFilter, setSelectedFilter] = useState(UserFilterType.All);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { userList } = localeKeys.settings.users;
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { createUser, updateUser } = routes.modules.children.settings.children.users.children;
  const { onExport, isExporting } = useUsersExporter();

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: t(userList.exporter.exportCsv),
    },
  ];

  const handleExportMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'csv') onExport(TypeDownloadEnum.CSV, selectedFilter, searchInputValue);
  };

  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = normalizeText(searchInputValue);

    const isSearchValueIncluded = (user: User) =>
      normalizeText(user.name).includes(lowerCaseQuery) ||
      normalizeText(user.email).includes(lowerCaseQuery);

    if (selectedFilter === UserFilterType.Active) {
      return data.filter(
        (user) =>
          isSearchValueIncluded(user) &&
          user.roles.some(
            (role) =>
              role.role === UserRole.WORKSPACE_ADMIN ||
              role.role === UserRole.WORKSPACE_AGENT ||
              role.role === UserRole.SYSTEM_ADMIN
          )
      );
    }

    if (selectedFilter === UserFilterType.Inactive) {
      return data.filter(
        (user) =>
          isSearchValueIncluded(user) &&
          user.roles.some((role) => role.role === UserRole.WORKSPACE_INACTIVE)
      );
    }

    return data.filter((user) => isSearchValueIncluded(user));
  }, [data, searchInputValue, selectedFilter]);

  const handleAddUser = () => {
    navigate(createUser.path);
  };

  const handleEditUser = async (userId: string) => {
    const path = generatePath(updateUser.path, { userId });
    navigate(path);
  };

  const isDisabled = (user: User) => {
    if (loggedUser && user.email === loggedUser.email) {
      return false;
    }

    return user.roles.some((role) =>
      [UserRole.SYSTEM_ADMIN, UserRole.SYSTEM_DEV_ADMIN].includes(role.role)
    );
  };
  const isAnyAdmin = loggedUser !== undefined && isAnySystemAdmin(loggedUser);

  useEffect(() => {
    getPlanUserLimit();
  }, [getPlanUserLimit]);

  const actionsButton = (
    <Space>
      <Dropdown.Button
        icon={<MoreOutlined />}
        loading={isExporting}
        onClick={() => onExport(TypeDownloadEnum.XLSX, selectedFilter, searchInputValue)}
        menu={{ items: exportMenuItems, onClick: handleExportMenuClick }}
      >
        <DownloadOutlined />
        {t(userList.exporter.exportXlsx)}
      </Dropdown.Button>
      {isAnyAdmin && (
        <Button onClick={() => setIsModalVisible(true)}>{t(userList.importSeveral)}</Button>
      )}
      <Button type='primary' onClick={handleAddUser}>
        {t(userList.add)}
      </Button>
    </Space>
  );

  const columns: ColumnsType<User> = [
    {
      width: 400,
      title: t(userList.nameColumn),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <SpanCapitalize>{name}</SpanCapitalize>,
      sorter: (a, b) => {
        const isAInactive = a.roles.some((role) => role.role === UserRole.WORKSPACE_INACTIVE);
        const isBInactive = b.roles.some((role) => role.role === UserRole.WORKSPACE_INACTIVE);

        if (isAInactive && !isBInactive) {
          return 1;
        }
        if (!isAInactive && isBInactive) {
          return -1;
        }
        return a.name.localeCompare(b.name);
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: t(userList.emailColumn),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t(userList.typeColumn),
      dataIndex: 'roles',
      key: 'roles',
      render: (permissionList: UserPermission[]) => {
        const roleTypes = permissionList
          ?.filter((role) => {
            return (
              role?.resourceId &&
              role.resourceId === workspaceId &&
              (role.role === UserRole.WORKSPACE_ADMIN ||
                role.role === UserRole.WORKSPACE_AGENT ||
                role.role === UserRole.WORKSPACE_INACTIVE)
            );
          })
          ?.map((permission) => {
            let roleType;
            if (permission.role === UserRole.WORKSPACE_ADMIN) {
              roleType = t(userList.admin);
            } else if (permission.role === UserRole.WORKSPACE_AGENT) {
              roleType = t(userList.agent);
            } else if (permission.role === UserRole.WORKSPACE_INACTIVE) {
              roleType = t(userList.inactive);
            } else {
              roleType = permission.role;
            }
            return { roleType, key: permission.resourceId };
          });

        return roleTypes.map((role: any) => role.roleType).join(', ');
      },
    },
    {
      title: t(userList.situationColumn),
      dataIndex: 'passwordExpires',
      key: 'passwordExpires',
      render: (passwordExpires: number) => {
        const now = dayjs().valueOf();
        const daysUntilExpiration = Math.floor((passwordExpires - now) / (1000 * 60 * 60 * 24));
        let colorTimeline;
        let situationText;
        if (daysUntilExpiration > 10) {
          colorTimeline = 'blue';
          situationText = `${daysUntilExpiration} ${t(userList.daysUntilExpiration)}`;
        } else if (daysUntilExpiration <= 0) {
          colorTimeline = 'red';
          situationText = t(userList.expiredPassword);
        } else if (daysUntilExpiration <= 10) {
          colorTimeline = 'orange';
          situationText = `${daysUntilExpiration} ${t(userList.daysUntilExpiration)}`;
        }

        return (
          <Space>
            <Tag bordered={false} color={colorTimeline}>
              {situationText}
            </Tag>
          </Space>
        );
      },
    },
    {
      key: 'acoes',
      width: '64px',
      fixed: 'right',
      dataIndex: 'acoes',
      render: (_, user) => (
        <Button
          key={user._id}
          type='link'
          icon={<EditOutlined />}
          disabled={isDisabled(user)}
          onClick={() => handleEditUser(user._id)}
        />
      ),
    },
  ];

  const getSummary = (total: number) => {
    const activeCount = filteredUsers.filter((user) =>
      user.roles.some(
        (role) =>
          role.role === UserRole.WORKSPACE_ADMIN ||
          role.role === UserRole.WORKSPACE_AGENT ||
          role.role === UserRole.SYSTEM_ADMIN
      )
    ).length;

    const inactiveCount = filteredUsers.filter((user) =>
      user.roles.some((role) => role.role === UserRole.WORKSPACE_INACTIVE)
    ).length;

    const activeUsersText = activeCount === 1 ? t(userList.active) : t(userList.actives);
    const inactiveUsersText = inactiveCount <= 1 ? t(userList.inactive) : t(userList.inactives);

    return (
      <StyledSummaryContainer>
        {`${total} ${t(userList.items)}, ${activeCount} ${activeUsersText} ${t(
          userList.and
        )} ${inactiveCount} ${inactiveUsersText}`}
      </StyledSummaryContainer>
    );
  };

  return (
    <PageTemplate actionButtons={actionsButton} title={t(userList.pageTitle)}>
      <Card styles={{ body: { paddingBottom: 0 } }}>
        <TableFiltersContainer justify='space-between' align='middle'>
          <Text style={{ maxWidth: '100%' }}>
            {`${messageUserLimit.userCount || 0}/${messageUserLimit.planUserLimit || 0} ${t(
              userList.amountContractedInThePlan
            )}`}
          </Text>
          <UserFilter
            selectedFilter={selectedFilter}
            searchInputValue={searchInputValue}
            setSelectedFilter={setSelectedFilter}
            setSearchInputValue={setSearchInputValue}
          />
        </TableFiltersContainer>
        <UserListContainer>
          <BodyContainer>
            <EnhancedTable
              rowKey={(row) => row._id}
              pagination={{
                showSizeChanger: true,
                showTotal: getSummary,
              }}
              loading={isLoading}
              scroll={{
                x: 1200,
                y: 'calc(100vh - 296px)',
              }}
              dataSource={filteredUsers}
              columns={columns}
            />
          </BodyContainer>
          <UserCreateMultiple
            onClose={() => {
              setIsModalVisible(false);
            }}
            visible={isModalVisible}
            fetchUserList={fetchUserList}
          />
        </UserListContainer>
      </Card>
    </PageTemplate>
  );
};
