import {
  ExclamationCircleOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Flex,
  Modal,
  Row,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MenuProps } from 'antd/lib/menu';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { CampaignStatus } from '~/constants/campaign-status';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import type { Campaign } from '~/interfaces/campaign';
import { routes } from '~/routes';
import { GridActionsColumn } from '../../components/grid-actions-column';
import { useCampaignList } from '../../hooks/use-campaign-list';
import type { FilterStatus } from './interfaces';
import { SearchInput, TableTitle } from './styles';

export const ViewBroadcastList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj, updateQueryString } = useQueryString<{
    search?: string;
    page?: string;
    pageSize?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>({
    allowedQueries: ['search', 'page', 'pageSize', 'status', 'startDate', 'endDate'],
  });

  const querySearch = queryStringAsObj.search || '';
  const currentPage = Number(queryStringAsObj.page) || 1;
  const pageSize = Number(queryStringAsObj.pageSize) || 10;
  const statusFilter = (queryStringAsObj.status as FilterStatus) || 'all';
  const startDate = queryStringAsObj.startDate
    ? dayjs(Number(queryStringAsObj.startDate))
    : undefined;
  const endDate = queryStringAsObj.endDate ? dayjs(Number(queryStringAsObj.endDate)) : undefined;
  const [searchInputValue, setSearchInputValue] = useState(querySearch);

  const { campaignList, isLoadingCampaignList, fetchCampaignList } = useCampaignList({
    pageSize,
    currentPage,
    search: querySearch,
    status:
      statusFilter !== 'all' && statusFilter !== 'hasFail' && statusFilter !== 'isTest'
        ? statusFilter
        : undefined,
    startDate,
    endDate,
    hasFail: statusFilter === 'hasFail',
    isTest: statusFilter === 'isTest',
  });

  const { children: broadcastListModules } =
    routes.modules.children.campaigns.children.broadcastList;

  const createNewTeamPath = generatePath(broadcastListModules.createBroadcastList.fullPath, {
    workspaceId,
  });

  const debouncedSearch = useRef(
    debounce((value: string) => {
      updateQueryString({ search: value, page: 1 });
    }, 300)
  ).current;

  const handleChangeSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleChangeFilter = (value: FilterStatus) => {
    updateQueryString({ status: value, page: 1 });
  };

  const handleChangePage = (page: number, pSize: number) => {
    updateQueryString({ page, pageSize: pSize });
  };

  const { t } = useTranslation();

  const broadcastGridLocaleKeys = localeKeys.campaign.broadcastList.pages.broadcastGrid;

  useEffect(() => {
    fetchCampaignList();
  }, [fetchCampaignList]);

  useEffect(() => {
    setSearchInputValue(querySearch);
  }, [querySearch]);

  const actionButtons = (
    <Space>
      <Link to={createNewTeamPath} state={{ queryStrings: location.search }}>
        <Button type='primary'>{t(broadcastGridLocaleKeys.createBroadcastButton)}</Button>
      </Link>
    </Space>
  );

  const pageTitle = (
    <Space>
      <span>{t(broadcastGridLocaleKeys.pageTitle)}</span>
      <Tooltip title={t(broadcastGridLocaleKeys.tooltipTitle)}>
        <Link to='https://botdesigner.tawk.help/article/lista-de-transmiss%C3%A3o' target='_blank'>
          <InfoCircleOutlined style={{ color: '#1677ff' }} />
        </Link>
      </Tooltip>
    </Space>
  );

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'all',
      label: t(broadcastGridLocaleKeys.tableFilterAll),
      onClick: () => {
        handleChangeFilter('all');
      },
    },
    {
      key: CampaignStatus.draft,
      label: t(broadcastGridLocaleKeys.tableFilterDraft),
      onClick: () => {
        handleChangeFilter(CampaignStatus.draft);
      },
    },
    {
      key: CampaignStatus.awaiting_send,
      label: t(broadcastGridLocaleKeys.tableFilterAwaitingSend),
      onClick: () => {
        handleChangeFilter(CampaignStatus.awaiting_send);
      },
    },
    {
      key: CampaignStatus.finished_complete,
      label: t(broadcastGridLocaleKeys.tableFilterFinishedComplete),
      onClick: () => {
        handleChangeFilter(CampaignStatus.finished_complete);
      },
    },
    {
      key: 'hasFail',
      label: t(broadcastGridLocaleKeys.tableFilterHasFail),
      onClick: () => {
        handleChangeFilter('hasFail');
      },
    },
    {
      key: 'isTest',
      label: t(broadcastGridLocaleKeys.tableFilterIsTest),
      onClick: () => {
        handleChangeFilter('isTest');
      },
    },
  ];

  const columns: ColumnsType<Campaign> = [
    {
      title: t(broadcastGridLocaleKeys.columnsTableName),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t(broadcastGridLocaleKeys.columnsTableStatus),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (_, broadcastList) => {
        if (broadcastList.status === CampaignStatus.finished_complete) {
          return <Tag color='green'>{t(broadcastGridLocaleKeys.statusTagSuccess)}</Tag>;
        }

        if (broadcastList.status === CampaignStatus.awaiting_send) {
          return <Tag color='blue'>{t(broadcastGridLocaleKeys.statusTagWaiting)}</Tag>;
        }

        if (broadcastList.status === CampaignStatus.paused) {
          return <Tag color='gold'>{t(broadcastGridLocaleKeys.statusTagPaused)}</Tag>;
        }

        if (broadcastList.status === CampaignStatus.draft) {
          return <Tag>{t(broadcastGridLocaleKeys.statusTagDraft)}</Tag>;
        }

        return <Tag color='purple'>{t(broadcastGridLocaleKeys.statusTagSending)}</Tag>;
      },
    },
    {
      title: t(broadcastGridLocaleKeys.columnsTableSendAt),
      dataIndex: 'sendAt',
      key: 'sendAt',
      width: 170,
      render: (_, broadcastList) => {
        if (broadcastList.sendAt) {
          const formattedSendAt = broadcastList.sendAt
            ? dayjs(Number(broadcastList.sendAt)).format('DD/MM/YYYY HH:mm')
            : undefined;
          return formattedSendAt;
        }

        if (broadcastList.startedAt) {
          const formattedStartAt = broadcastList.startedAt
            ? dayjs(Number(broadcastList.startedAt)).format('DD/MM/YYYY HH:mm')
            : undefined;

          return formattedStartAt;
        }

        return t(broadcastGridLocaleKeys.statusTagNotScheduled);
      },
    },
    {
      title: t(broadcastGridLocaleKeys.columnsTableSentTo),
      dataIndex: 'sentTo',
      key: 'sentTo',
      width: 320,
      render: (_, broadcastList) => {
        const { resume } = broadcastList;
        const { contactResume, unsentCount } = resume || {};

        const hasError =
          broadcastList.status === CampaignStatus.finished_complete &&
          unsentCount &&
          unsentCount > 0;

        if (!contactResume) {
          return '';
        }

        if (hasError) {
          const cloneBroadcastPath = generatePath(
            broadcastListModules.cloneBroadcastList.fullPath,
            {
              workspaceId,
              broadcastListId: broadcastList.id,
            }
          );
          const tooltipTitle =
            unsentCount !== 1
              ? t(broadcastGridLocaleKeys.unsentContactsPlural, { unsentCount })
              : t(broadcastGridLocaleKeys.unsentContactsSingular, { unsentCount });

          const handleCloneBroadcast = (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            Modal.confirm({
              title: t(broadcastGridLocaleKeys.modalConfirmTitle),
              icon: null,
              width: 534,
              content: (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Alert
                      message={t(broadcastGridLocaleKeys.modalConfirmAlertMessage)}
                      type='warning'
                      showIcon
                    />
                  </Col>
                  <Col span={24}>
                    <span>{t(broadcastGridLocaleKeys.modalConfirmSpanMessage)}</span>
                  </Col>
                </Row>
              ),
              okText: t(broadcastGridLocaleKeys.okText),
              cancelText: t(broadcastGridLocaleKeys.cancelText),
              onOk() {
                navigate(`${cloneBroadcastPath}?contactsWithError=true`, {
                  state: { queryStrings: location.search },
                });
              },
            });
          };

          return (
            <Space>
              <Tooltip title={tooltipTitle}>
                <Tag
                  icon={<ExclamationCircleOutlined />}
                  color='warning'
                  style={{ cursor: 'pointer' }}
                >
                  {t(broadcastGridLocaleKeys.statusTagFailed)}
                </Tag>
              </Tooltip>
              <Button type='link' onClick={handleCloneBroadcast} style={{ padding: 0 }}>
                {t(broadcastGridLocaleKeys.columnsTableContactSummaryTotal, {
                  contactsSentCount: contactResume.contactCount - unsentCount,
                  contactCount: contactResume?.contactCount,
                })}
              </Button>
            </Space>
          );
        }

        return (
          <span>
            {t(broadcastGridLocaleKeys.columnsTableContactSummaryTotal, {
              contactsSentCount: contactResume.contactCount - (unsentCount || 0),
              contactCount: contactResume?.contactCount,
            })}
          </span>
        );
      },
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      width: 210,
      align: 'right',
      fixed: 'right',
      render: (_, broadcastList) => {
        return <GridActionsColumn broadcastList={broadcastList} updateList={fetchCampaignList} />;
      },
    },
  ];

  return (
    <PageTemplate title={pageTitle} actionButtons={actionButtons}>
      <Card styles={{ body: { paddingBottom: 0 } }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Flex justify='space-between' align='center' gap={32}>
              <TableTitle>{t(broadcastGridLocaleKeys.tableTitle)}</TableTitle>
              <Space wrap>
                <DatePicker.RangePicker
                  allowClear
                  format='DD/MM/YYYY HH:mm'
                  placeholder={[
                    t(broadcastGridLocaleKeys.placeholderStartDate),
                    t(broadcastGridLocaleKeys.placeholderEndDate),
                  ]}
                  showTime={{ defaultValue: [dayjs('00:00', 'HH:mm'), dayjs('23:59', 'HH:mm')] }}
                  value={[startDate, endDate]}
                  style={{ width: 320 }}
                  onChange={(dates) => {
                    const newStart = dates && dates[0]?.isValid() ? dates[0] : undefined;
                    const newEnd = dates && dates[1]?.isValid() ? dates[1] : undefined;
                    updateQueryString({
                      startDate: newStart ? newStart.valueOf() : undefined,
                      endDate: newEnd ? newEnd.valueOf() : undefined,
                      page: 1,
                    });
                  }}
                />
                <SearchInput
                  value={searchInputValue}
                  onChange={handleChangeSearchInput}
                  placeholder={t(broadcastGridLocaleKeys.placeholderSearchInput)}
                  allowClear
                  style={{ width: 240 }}
                />
                <Dropdown menu={{ items: dropdownItems, selectedKeys: [statusFilter] }}>
                  <Button icon={<FilterOutlined />} />
                </Dropdown>
                <Button icon={<RedoOutlined />} onClick={fetchCampaignList}>
                  {t(broadcastGridLocaleKeys.buttonReload)}
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col span={24}>
            <EnhancedTable
              columns={columns}
              dataSource={campaignList?.data || []}
              bordered
              loading={isLoadingCampaignList}
              pagination={{
                total: campaignList?.metadata?.count || 0,
                current: currentPage,
                pageSize,
                onChange: handleChangePage,
                showTotal: (total) =>
                  total > 1
                    ? `${total} ${t(broadcastGridLocaleKeys.paginationTotalPlural)}`
                    : `${total} ${t(broadcastGridLocaleKeys.paginationTotalSingular)}`,
              }}
              scroll={{
                y: 'calc(100vh - 290px)',
                x: 1200,
              }}
            />
          </Col>
        </Row>
      </Card>
    </PageTemplate>
  );
};
