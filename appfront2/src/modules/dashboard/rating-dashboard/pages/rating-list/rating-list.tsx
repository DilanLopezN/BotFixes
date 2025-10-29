import {
  DownloadOutlined,
  FilterOutlined,
  MoreOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Dropdown,
  Flex,
  MenuProps,
  Rate,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { useQueryString } from '~/hooks/use-query-string';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { FiltersModal } from '../../components/filters-modal';
import { InfoAvgRatings } from '../../components/info-avg-ratings';
import { InfoRatingPanel } from '../../components/info-rating-panel';
import { allowedQueries } from '../../constants';
import { useRatingExporter } from '../../hooks/use-rating-exporter';
import { useRatings } from '../../hooks/use-ratings';
import { useTeamList } from '../../hooks/use-team-list';
import { useUserList } from '../../hooks/use-user-list';
import { Rating, RatingDashboardQueryStrings } from '../../interfaces';

export const RatingDashboardList = () => {
  const { Text } = Typography;
  const { t } = useTranslation();
  const { queryStringAsObj, updateQueryString } = useQueryString<RatingDashboardQueryStrings>({
    allowedQueries,
  });
  const { generalConfigs } = useSelectedWorkspace();

  const [isFiltersModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);
  const [isRatingStatsVisible, setIsRatingStatsVisible] = useState(true);

  const { ratings, isFetchingRatings } = useRatings();
  const { isDownloading, downloadFile } = useRatingExporter();
  const { userList } = useUserList();
  const { teamList } = useTeamList();

  const startDate = queryStringAsObj.startDate ? dayjs(queryStringAsObj.startDate) : undefined;
  const endDate = queryStringAsObj.endDate ? dayjs(queryStringAsObj.endDate) : undefined;

  const filterCount = useMemo(() => {
    const memberIdCount = queryStringAsObj?.memberId ? 1 : 0;
    const teamIdsCount = queryStringAsObj?.teamIds?.split(',')?.length || 0;
    const tagsCount = queryStringAsObj?.tags?.split(',')?.length || 0;
    const noteCount = queryStringAsObj?.note ? 1 : 0;
    const feedbackCount = queryStringAsObj?.feedback ? 1 : 0;
    return memberIdCount + teamIdsCount + tagsCount + noteCount + feedbackCount;
  }, [
    queryStringAsObj?.memberId,
    queryStringAsObj?.teamIds,
    queryStringAsObj?.tags,
    queryStringAsObj?.note,
    queryStringAsObj?.feedback,
  ]);

  const handleChangeDateRangePicker: RangePickerProps['onChange'] = (dates) => {
    const newStartDate = dates?.[0]?.format('YYYY-MM-DD') || '';
    const newEndDate = dates?.[1]?.format('YYYY-MM-DD') || '';
    updateQueryString({ startDate: newStartDate, endDate: newEndDate, currentPage: 1 });
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    downloadFile(e.key as 'xlsx' | 'csv');
  };

  const handleChangePage = (page: number, pageSize: number) => {
    updateQueryString({ currentPage: page, pageSize });
  };

  const handleRowClick = (record: Rating) => {
    if (isInfoPanelVisible && selectedRating?.id === record.id) {
      setIsInfoPanelVisible(false);
      setSelectedRating(null);
    } else {
      setSelectedRating(record);
      setIsInfoPanelVisible(true);
    }
  };

  const handleCloseInfoPanel = () => {
    setIsInfoPanelVisible(false);
    setSelectedRating(null);
  };

  const handleCloseFiltersModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleToggleRatingStats = () => {
    setIsRatingStatsVisible(!isRatingStatsVisible);
  };

  const ratingLocaleKeys = localeKeys.dashboard.ratingDashboard;

  useEffect(() => {
    if (!queryStringAsObj.startDate || !queryStringAsObj.endDate) {
      const today = dayjs().format('YYYY-MM-DD');
      const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
      updateQueryString({
        startDate: sevenDaysAgo,
        endDate: today,
      });
    }
  }, [queryStringAsObj.startDate, queryStringAsObj.endDate, updateQueryString]);

  useEffect(() => {
    if (!queryStringAsObj.currentPage) {
      updateQueryString({ currentPage: 1 });
    }
    if (!queryStringAsObj.pageSize) {
      updateQueryString({ pageSize: 10 });
    }
  }, [queryStringAsObj.currentPage, queryStringAsObj.pageSize, updateQueryString]);

  const getMenuItems = (workspaceId: string, conversationId: string): MenuProps['items'] => {
    const liveAgentPath = getBaseUrl({
      pathname: '/live-agent',
      appTypePort: AppTypePort.APP,
      queryString: `?workspace=${workspaceId}&conversation=${conversationId}`,
      addExtraQueries: false,
    });

    return [
      {
        key: '1',
        icon: <ShareAltOutlined />,
        label: (
          <Link to={liveAgentPath} target='_blank' rel='noopener noreferrer'>
            {t(ratingLocaleKeys.goToConversation)}
          </Link>
        ),
      },
    ];
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'xlsx',
      label: t(ratingLocaleKeys.buttonDownloadXLSX),
    },
  ];

  const columns: ColumnType<Rating>[] = [
    {
      title: t(ratingLocaleKeys.columnRating),
      dataIndex: 'value',
      key: 'rating',
      width: 180,
      render: (value) => <Rate disabled defaultValue={value} />,
    },
    {
      title: t(ratingLocaleKeys.columnFeedback),
      dataIndex: 'ratingFeedback',
      key: 'feedback',
      ellipsis: true,
    },
    {
      title: t(ratingLocaleKeys.columnTags),
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      ellipsis: true,
      render: (tags: string[]) => (
        <Space size={[0, 8]} wrap>
          {tags?.map((tag) => (
            <Tag color='blue' key={tag} style={{ maxWidth: 100 }} title={tag}>
              <Text ellipsis={{ tooltip: tag }}>{tag}</Text>
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t(ratingLocaleKeys.columnDate),
      dataIndex: 'ratingAt',
      key: 'date',
      width: 130,
      ellipsis: true,
      render: (ratingAt) => dayjs(Number(ratingAt)).format('DD/MM/YYYY'),
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuItems(record.workspaceId, record.conversationId) }}
          placement='bottomRight'
        >
          <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const pageTitle = (
    <Space align='center'>
      <span>{t(ratingLocaleKeys.pageTitle)}</span>
      {!generalConfigs?.enableRating && (
        <Alert message='Para visualizar as avaliações dos atendimentos, ative a opção de Avaliação no menu de Configurações.' />
      )}
    </Space>
  );

  return (
    <PageTemplate title={pageTitle}>
      <Drawer
        title='Detalhes da Avaliação'
        placement='right'
        onClose={handleCloseInfoPanel}
        open={isInfoPanelVisible && !!selectedRating}
        width={600}
        closable
      >
        {selectedRating && (
          <InfoRatingPanel
            rating={selectedRating}
            users={userList}
            teams={teamList?.data || []}
            onClose={handleCloseInfoPanel}
          />
        )}
      </Drawer>
      <Row gutter={16} wrap={false} style={{ paddingBottom: 16 }}>
        {isRatingStatsVisible && (
          <Col flex='250px'>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <InfoAvgRatings loading={isFetchingRatings} infoAvgRating={ratings} />
            </div>
          </Col>
        )}

        <Col flex='auto'>
          <div
            style={{
              position: 'fixed',
              width: `calc(100vw - 320px - ${isRatingStatsVisible ? '250' : 0}px)`,
              height: '100vh',
              top: 81,
              right: 30,
            }}
          >
            <Card styles={{ body: { paddingBottom: 0 } }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Flex justify='space-between' gap={16} wrap='wrap'>
                    <Space>
                      <span>{t(ratingLocaleKeys.periodFilter)}</span>
                      <DatePicker.RangePicker
                        allowClear
                        format='DD/MM/YYYY'
                        style={{ width: 240 }}
                        onChange={handleChangeDateRangePicker}
                        value={[startDate, endDate]}
                        placeholder={[t(ratingLocaleKeys.startDate), t(ratingLocaleKeys.endDate)]}
                      />
                    </Space>
                    <Space>
                      <Tooltip
                        title={
                          isRatingStatsVisible
                            ? 'Ocultar estatísticas de avaliação'
                            : 'Exibir estatísticas de avaliação'
                        }
                      >
                        <Button onClick={handleToggleRatingStats}>
                          {isRatingStatsVisible ? <StarFilled /> : <StarOutlined />}
                        </Button>
                      </Tooltip>
                      <Button icon={<FilterOutlined />} onClick={() => setIsFilterModalOpen(true)}>
                        <Space align='center'>
                          {t(ratingLocaleKeys.filterButton)}
                          {filterCount > 0 && <Badge count={filterCount} />}
                        </Space>
                      </Button>
                      <Dropdown.Button
                        icon={<MoreOutlined />}
                        loading={isDownloading}
                        onClick={() => downloadFile('csv')}
                        menu={{ items: menuItems, onClick: handleMenuClick }}
                      >
                        <DownloadOutlined />
                        {t(ratingLocaleKeys.buttonDownloadCSV)}
                      </Dropdown.Button>
                    </Space>
                  </Flex>
                </Col>
                <Col span={24}>
                  <EnhancedTable
                    rowKey={(row) => row.id}
                    columns={columns}
                    dataSource={ratings?.data || []}
                    loading={isFetchingRatings}
                    onRow={(record) => ({
                      onClick: () => handleRowClick(record),
                      style: { cursor: 'pointer' },
                    })}
                    bordered
                    pagination={{
                      total: ratings?.count || 0,
                      current: Number(queryStringAsObj.currentPage || 1),
                      pageSize: Number(queryStringAsObj.pageSize || 10),
                      onChange: handleChangePage,
                      showTotal: (total) =>
                        `${total} ${t(
                          total !== 1
                            ? ratingLocaleKeys.paginationPlural
                            : ratingLocaleKeys.paginationSingular
                        )}`,
                    }}
                    scroll={{
                      y: 'calc(100vh - 300px)',
                    }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </Col>
      </Row>
      <FiltersModal isVisible={isFiltersModalOpen} onClose={handleCloseFiltersModal} />
    </PageTemplate>
  );
};
