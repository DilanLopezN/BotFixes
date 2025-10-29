import { useTranslation } from 'react-i18next';
import { DownloadOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Flex,
  Input,
  MenuProps,
  Popover,
  Row,
  Space,
  Typography,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { SearchProps } from 'antd/es/input';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ConversationPreviewModal } from '~/components/conversation-preview-modal';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { useQueryString } from '~/hooks/use-query-string';
import type { GetConversationCategorizationResponse } from '~/services/workspace/get-conversation-categorizations';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { FiltersModal } from '../../components/filters-modal';
import { TagViewer } from '../../components/tags-viewer';
import { allowedQueries } from '../../constants';
import { useCategorizationCsv } from '../../hooks/use-categorization-csv';
import { useConversationCategorizations } from '../../hooks/use-conversation-categorizations';
import type { FinishedConversationsDashboardQueryStrings } from '../../interfaces';

export const CategorizationDashboardList = () => {
  const { Text } = Typography;
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();
  const { queryStringAsObj, updateQueryString } =
    useQueryString<FinishedConversationsDashboardQueryStrings>({
      allowedQueries,
    });
  const [isConversationPreviewModalOpen, setIsConversationPreviewModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [isFiltersModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(queryStringAsObj.search || '');

  const { conversationCategorizations, isFetchingConversationCategorizations } =
    useConversationCategorizations();
  const { downloadCategorizationCsv, isDownloadingCategorizationCsv } = useCategorizationCsv();

  const startDate = queryStringAsObj.startDate ? dayjs(queryStringAsObj.startDate) : undefined;
  const endDate = queryStringAsObj.endDate ? dayjs(queryStringAsObj.endDate) : undefined;

  const filterCount = useMemo(() => {
    const userIdsCount = queryStringAsObj?.userIds?.split(',')?.length || 0;
    const teamIdsCount = queryStringAsObj?.teamIds?.split(',')?.length || 0;
    const objectiveIdsCount = queryStringAsObj?.objectiveIds?.split(',')?.length || 0;
    const outcomeIdsCount = queryStringAsObj?.outcomeIds?.split(',')?.length || 0;
    const conversationTagsCount = queryStringAsObj?.conversationTags?.split(',')?.length || 0;

    return (
      userIdsCount + teamIdsCount + objectiveIdsCount + outcomeIdsCount + conversationTagsCount
    );
  }, [
    queryStringAsObj?.conversationTags,
    queryStringAsObj?.objectiveIds,
    queryStringAsObj?.outcomeIds,
    queryStringAsObj?.teamIds,
    queryStringAsObj?.userIds,
  ]);

  const handleSearch: SearchProps['onSearch'] = (newSearch) => {
    updateQueryString({ search: newSearch, currentPage: 1 });
  };

  const handleChangeDateRangePicker: RangePickerProps['onChange'] = (dates, _datesAsString) => {
    const newStartDate = dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '';
    const newEndDate = dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '';
    updateQueryString({ startDate: newStartDate, endDate: newEndDate, currentPage: 1 });
  };

  const handleChangePage = (page: number, pSize: number) => {
    updateQueryString({ currentPage: page, pageSize: pSize });
  };

  const handleCloseFiltersModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleOpenConversationPreviewModal = (conversationId: string) => {
    setIsConversationPreviewModalOpen(true);
    setSelectedConversationId(conversationId);
  };

  const handleCloseConversationPreviewModal = () => {
    setIsConversationPreviewModalOpen(false);
    setSelectedConversationId(undefined);
  };

  const { t } = useTranslation();

  const categorizationListLocaleKeys =
    localeKeys.dashboard.categorizationDashboard.pages.categorizationList;

  useEffect(() => {
    const currentPageAsNumber = Number(queryStringAsObj.currentPage);
    if (currentPageAsNumber && currentPageAsNumber > 0) {
      return;
    }
    const newCurrentPage = 1;
    updateQueryString({ currentPage: newCurrentPage });
  }, [queryStringAsObj.currentPage, updateQueryString]);

  useEffect(() => {
    const pageSizeAsNumber = Number(queryStringAsObj.pageSize);
    if (pageSizeAsNumber && pageSizeAsNumber > 0) {
      return;
    }
    const newPageSize = 10;
    updateQueryString({ pageSize: newPageSize });
  }, [queryStringAsObj.pageSize, updateQueryString]);

  const getPopoverMenuItems = (conversationId: string): MenuProps['items'] => {
    const liveAgentpath = getBaseUrl({
      pathname: '/live-agent',
      appTypePort: AppTypePort.APP,
      queryString: `?workspace=${workspaceId}&conversation=${conversationId}`,
      addExtraQueries: false,
    });

    return [
      {
        key: '1',
        label: (
          <Link to={liveAgentpath} target='_blank' rel='noopener noreferrer'>
            {t(categorizationListLocaleKeys.labelLink)}
          </Link>
        ),
      },
    ];
  };

  const columns: ColumnType<GetConversationCategorizationResponse[number]>[] = [
    {
      title: t(categorizationListLocaleKeys.columnTitleId),
      dataIndex: 'id',
      key: 'id',
      width: 130,
      ellipsis: true,
      render: (id) => {
        return <span>#{id}</span>;
      },
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleAgent),
      dataIndex: ['user', 'name'],
      key: 'userName',
      width: 200,
      ellipsis: true,
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleObjective),
      dataIndex: ['objective', 'name'],
      key: 'objectiveName',
      width: 200,
      ellipsis: true,
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleOutcome),
      dataIndex: ['outcome', 'name'],
      key: 'outcomeName',
      width: 200,
      ellipsis: true,
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleTags),
      dataIndex: 'conversationTags',
      key: 'conversationTags',
      width: 130,
      ellipsis: true,
      render: (conversationTags) => {
        return <TagViewer tags={conversationTags} />;
      },
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleDescription),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (description) => {
        return (
          <Popover
            content={description}
            title='Descrição'
            trigger='click'
            overlayStyle={{ width: 400 }}
          >
            <Button type='text' block>
              <Text ellipsis>{description}</Text>
            </Button>
          </Popover>
        );
      },
    },
    {
      title: t(categorizationListLocaleKeys.columnTitleDate),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      ellipsis: true,
      render: (createdAt) => {
        const formattedDate = dayjs(Number(createdAt)).format('DD/MM/YYYY');

        return <div>{formattedDate}</div>;
      },
    },
    {
      title: '',
      width: 240,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      render: (_actions, { conversationId }) => {
        return (
          <Space>
            <Button
              onClick={() => {
                handleOpenConversationPreviewModal(conversationId);
              }}
            >
              {t(categorizationListLocaleKeys.buttonViewConversation)}
            </Button>
            <Dropdown menu={{ items: getPopoverMenuItems(conversationId) }} placement='bottomLeft'>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <PageTemplate title={t(categorizationListLocaleKeys.PageTemplateTitle)}>
      <Card styles={conversationCategorizations?.data ? { body: { paddingBottom: 0 } } : undefined}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Flex justify='space-between' gap={16}>
              <Space>
                <span>{t(categorizationListLocaleKeys.spanPeriodFilter)}</span>
                <DatePicker.RangePicker
                  allowClear
                  format='DD/MM/YYYY'
                  style={{ width: 240 }}
                  onChange={handleChangeDateRangePicker}
                  value={[startDate, endDate]}
                  placeholder={[
                    t(categorizationListLocaleKeys.placeholderDateStar),
                    t(categorizationListLocaleKeys.placeholderDateEnd),
                  ]}
                />
              </Space>
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={downloadCategorizationCsv}
                  loading={isDownloadingCategorizationCsv}
                >
                  {t(categorizationListLocaleKeys.buttonDownload)}
                </Button>
                <Input.Search
                  placeholder={t(categorizationListLocaleKeys.inputPlaceholder)}
                  value={searchInputValue}
                  onChange={(e) => {
                    setSearchInputValue(e.target.value);
                  }}
                  allowClear
                  onSearch={handleSearch}
                />
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setIsFilterModalOpen(true);
                  }}
                >
                  <Space align='center'>
                    {t(categorizationListLocaleKeys.buttonFilter)}{' '}
                    {filterCount > 0 && <Badge count={filterCount} />}
                  </Space>
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col span={24}>
            <EnhancedTable
              rowKey={(row) => row.id}
              columns={columns}
              dataSource={conversationCategorizations?.data || []}
              loading={isFetchingConversationCategorizations}
              bordered
              pagination={{
                total: conversationCategorizations?.metadata?.count || 0,
                current: Number(queryStringAsObj.currentPage || 1),
                pageSize: Number(queryStringAsObj.pageSize || 10),
                onChange: handleChangePage,
                showTotal: (total) =>
                  total !== 1
                    ? `${total} ${t(categorizationListLocaleKeys.paginationPluralShowTotal)}`
                    : `${total} ${t(categorizationListLocaleKeys.paginationSingShowTotal)}`,
              }}
              scroll={{
                y: 'calc(100vh - 290px)',
              }}
            />
          </Col>
        </Row>
      </Card>
      <FiltersModal isVisible={isFiltersModalOpen} onClose={handleCloseFiltersModal} />
      <ConversationPreviewModal
        isVisible={isConversationPreviewModalOpen}
        conversationId={selectedConversationId}
        onClose={handleCloseConversationPreviewModal}
      />
    </PageTemplate>
  );
};
