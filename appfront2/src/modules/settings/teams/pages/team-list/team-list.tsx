import { RedoOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { debounce } from 'lodash';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, generatePath, useLocation, useParams } from 'react-router-dom';
import { AvatarList } from '~/components/avatar-list';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import type { SimplifiedTeam } from '~/interfaces/simplified-team';
import { routes } from '~/routes';
import { useQueryString } from '~/hooks/use-query-string';
import { useTeamList } from '../../hooks/use-team-list';
import { SearchInput, TableTitle } from './styles';

export const TeamList = () => {
  const { t } = useTranslation();
  const { teamList } = localeKeys.settings.teams.pages;
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const { queryStringAsObj, updateQueryString } = useQueryString<{
    search?: string;
    page?: string;
    pageSize?: string;
  }>({
    allowedQueries: ['search', 'page', 'pageSize'],
  });

  const querySearch = queryStringAsObj.search || '';
  const currentPage = Number(queryStringAsObj.page) || 1;
  const pageSize = Number(queryStringAsObj.pageSize) || 10;
  const [searchInputValue, setSearchInputValue] = useState(querySearch);

  const {
    data: paginatedTeamList,
    isLoading,
    fetchTeamList,
  } = useTeamList({
    currentPage,
    pageSize,
    search: querySearch,
  });

  const { children: teamsModules } = routes.modules.children.settings.children.teams;

  const createNewTeamPath = generatePath(teamsModules.createNewTeam.fullPath, { workspaceId });

  const debouncedSearch = useRef(
    debounce((value: string) => {
      updateQueryString({ search: value, page: 1 });
    }, 300)
  ).current;

  const handleChangeSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleChangePage = (page: number, pSize: number) => {
    updateQueryString({ page, pageSize: pSize });
  };

  useEffect(() => {
    fetchTeamList();
  }, [fetchTeamList]);

  const actionButtons = (
    <Space>
      <Link to={createNewTeamPath}>
        <Button type='primary'>{t(teamList.addTeamButton)}</Button>
      </Link>
    </Space>
  );

  const columns: ColumnsType<SimplifiedTeam> = [
    {
      title: t(teamList.tableTitle),
      dataIndex: 'name',
      key: 'name',
      render: (_, team) => {
        const isInactive = Boolean(team.inactivedAt);

        if (isInactive) {
          return (
            <Space size='middle'>
              <span>{team.name}</span>
              <Tag color='red'>{t(teamList.inactiveTag)}</Tag>
            </Space>
          );
        }

        return <span>{team.name}</span>;
      },
    },
    {
      title: '',
      dataIndex: 'userList',
      key: 'userList',
      align: 'end',
      width: 190,
      render: (_, team) => {
        return team.users.length !== 0 ? (
          <AvatarList data={team.users} hiddenCount={team.usersCount - team.users.length} />
        ) : (
          <span>{t(teamList.noUserMessage)}</span>
        );
      },
    },
    {
      dataIndex: 'actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, team) => {
        const viewTeamPath = generatePath(teamsModules.viewTeam.fullPath, {
          workspaceId,
          teamId: team._id,
        });
        return (
          <Link to={viewTeamPath} state={{ queryStrings: location.search }}>
            <Button>{t(teamList.viewTeamButton)}</Button>
          </Link>
        );
      },
    },
  ];

  return (
    <PageTemplate title={t(teamList.pageHeader)} actionButtons={actionButtons}>
      <Card styles={{ body: { paddingBottom: 0 } }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Flex justify='space-between'>
              <TableTitle>{t(teamList.pageTitle)}</TableTitle>
              <Space wrap>
                <SearchInput
                  value={searchInputValue}
                  onChange={handleChangeSearchInput}
                  placeholder={t(teamList.searchInputPlaceholder)}
                />
                <Button icon={<RedoOutlined />} onClick={fetchTeamList} disabled={isLoading}>
                  {t(teamList.refreshButton)}
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col span={24}>
            <EnhancedTable
              columns={columns}
              dataSource={paginatedTeamList?.data || []}
              loading={isLoading}
              bordered
              pagination={{
                total: paginatedTeamList?.count,
                current: currentPage,
                pageSize,
                onChange: handleChangePage,
                showTotal: (total) =>
                  total > 1
                    ? `${total} ${t(teamList.totalUsersTable)}`
                    : `${total} ${t(teamList.totalUserTable)}`,
              }}
              scroll={{
                y: 'calc(100vh - 296px)',
                x: 664,
              }}
            />
          </Col>
        </Row>
      </Card>
    </PageTemplate>
  );
};
