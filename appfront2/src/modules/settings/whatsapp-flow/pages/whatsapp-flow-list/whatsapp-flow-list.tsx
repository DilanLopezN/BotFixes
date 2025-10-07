import { EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Input, Space, Tag, Tooltip, Typography } from 'antd';
import { SearchProps } from 'antd/es/input';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { FlowCategoryEnum } from '~/constants/flow-category';
import { useQueryString } from '~/hooks/use-query-string';
import { useWindowSize } from '~/hooks/use-window-size';
import { localeKeys } from '~/i18n';
import { Flow } from '~/interfaces/flow';
import { WhatsappFlowLibrary } from '~/interfaces/flow-libraries';
import { useChannelConfigList } from '~/modules/campaigns/broadcast-list/hooks/use-channel-config-list';
import { routes } from '~/routes';
import { FiltersModal } from '../../components/filters-modal';
import {
  flowCategoryHelpMap,
  flowCategoryLabelMap,
  maxScreenSizeToCompactActions,
} from '../../constants';
import { useFlowLibraries } from '../../hooks/use-flow-libraries';
import { WhatsAppFlowQueryStrings } from '../../interfaces';

const { Text } = Typography;

export const WhatsAppFlowList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { children: whatsAppModule } = routes.modules.children.settings.children.whatsAppFlow;
  const { queryStringAsObj, updateQueryString } = useQueryString<WhatsAppFlowQueryStrings>();
  const { flowLibraries, isFetchingFlowLibraries } = useFlowLibraries();
  const { channelConfigList, fetchChannelConfigList, isLoadingChannelConfigList } =
    useChannelConfigList();
  const [searchInputValue, setSearchInputValue] = useState(queryStringAsObj.search || '');
  const [isFiltersModalOpen, setIsFilterModalOpen] = useState(false);
  const { width: screenWidth } = useWindowSize();

  const { t } = useTranslation();

  const whatsAppFlowLocaleKeys = localeKeys.settings.whatsAppFlow.pages;

  const filterCount = useMemo(() => {
    const categories = queryStringAsObj?.categoriesIds?.split(',')?.length || 0;
    const channelStatus = queryStringAsObj?.channelStatus?.split(',')?.length || 0;
    return categories + channelStatus;
  }, [queryStringAsObj?.categoriesIds, queryStringAsObj?.channelStatus]);

  const shouldCompactTableActions = screenWidth < maxScreenSizeToCompactActions;

  const handleCloseFiltersModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleSearch: SearchProps['onSearch'] = (newSearch) => {
    updateQueryString({ search: newSearch, currentPage: 1 });
  };

  const handleChangePage = (page: number, pSize: number) => {
    updateQueryString({ currentPage: page, pageSize: pSize });
  };

  // const getBadgeStatus = (status: FlowStatusEnum): FlowStatusBadgeType => {
  //   return flowStatusBadgeMap[status] ?? 'default';
  // };

  useEffect(() => {
    fetchChannelConfigList();
  }, [fetchChannelConfigList]);

  const columns: ColumnsType<WhatsappFlowLibrary> = [
    {
      title: t(whatsAppFlowLocaleKeys.list.nameColumn),
      dataIndex: 'friendlyName',
      key: 'friendlyName',
      width: 300,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t(whatsAppFlowLocaleKeys.list.channelsColumn),
      dataIndex: 'flows',
      key: 'flows',
      render: (_flows: Flow[], record: WhatsappFlowLibrary) => {
        const allChannels = channelConfigList?.data ?? [];

        if (allChannels.length === 0) {
          return <Text type='secondary'>{t(whatsAppFlowLocaleKeys.list.noFlows)}</Text>;
        }

        return (
          <Space direction='vertical' size={8}>
            {allChannels.map((channel) => {
              const matchedFlow = record.flows.find((flow) => flow.channelConfigId === channel._id);
              const channelName = channel.name || t(whatsAppFlowLocaleKeys.list.unknownChannel);

              return (
                <Space
                  key={channel._id}
                  size={4}
                  style={{ maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  <Text style={{ maxWidth: 180 }} ellipsis={{ tooltip: channelName }}>
                    {channelName}:
                  </Text>
                  {matchedFlow ? (
                    <Tag color={matchedFlow.active ? 'green' : 'red'}>
                      {matchedFlow.active
                        ? t(whatsAppFlowLocaleKeys.list.enabledTag)
                        : t(whatsAppFlowLocaleKeys.list.disabledTag)}
                    </Tag>
                  ) : (
                    <Tag color='default'>
                      {t(whatsAppFlowLocaleKeys.list.availableToActivateTag)}
                    </Tag>
                  )}
                </Space>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: t(whatsAppFlowLocaleKeys.list.categoriesColumn),
      dataIndex: 'flowCategories',
      key: 'flowCategories',
      width: 150,
      render: (categories: FlowCategoryEnum[]) =>
        categories.length > 0 ? (
          <Space wrap size={[0, 8]}>
            {categories.map((cat) => (
              <Tooltip title={t(flowCategoryHelpMap[cat] || cat)}>
                <Tag key={cat}>{t(flowCategoryLabelMap[cat] || cat)}</Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          <Text type='secondary'>{t(whatsAppFlowLocaleKeys.list.noCategory)}</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      width: 60,
      render: (_: unknown, record: WhatsappFlowLibrary) => {
        const editTrainingPath = generatePath(whatsAppModule.viewWhatsAppFlow.fullPath, {
          workspaceId,
          flowId: record.id,
        });

        return (
          <Link to={editTrainingPath}>
            <Tooltip title={t(whatsAppFlowLocaleKeys.list.openFlowTooltip)}>
              <Button icon={<EditOutlined />} />
            </Tooltip>
          </Link>
        );
      },
    },
  ];

  return (
    <PageTemplate title={t(whatsAppFlowLocaleKeys.list.title)}>
      <Card
        styles={{ body: { paddingBottom: 0 } }}
        title={t(whatsAppFlowLocaleKeys.list.flowsTitle)}
        extra={
          <Space>
            <Col>
              <Input.Search
                placeholder={t(whatsAppFlowLocaleKeys.list.searchInputPlaceholder)}
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                }}
                onSearch={handleSearch}
                allowClear
              />
            </Col>
            <Col>
              <Tooltip title={t(whatsAppFlowLocaleKeys.list.filtersButton)}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setIsFilterModalOpen(true);
                  }}
                >
                  {!shouldCompactTableActions ? (
                    <Space align='center'>
                      {t(whatsAppFlowLocaleKeys.list.filtersButton)}
                      {filterCount > 0 && <Badge count={filterCount} />}
                    </Space>
                  ) : (
                    filterCount > 0 && <Badge count={filterCount} />
                  )}
                </Button>
              </Tooltip>
            </Col>
          </Space>
        }
      >
        <EnhancedTable
          rowKey={(row) => row.id}
          loading={isFetchingFlowLibraries || isLoadingChannelConfigList}
          scroll={{
            y: 'calc(100dvh - 300px)',
            x: 800,
          }}
          bordered
          columns={columns}
          dataSource={flowLibraries ?? []}
          pagination={{
            pageSize: Number(queryStringAsObj.pageSize || 10),
            current: Number(queryStringAsObj.currentPage || 1),
            onChange: handleChangePage,
          }}
        />
      </Card>
      <FiltersModal isVisible={isFiltersModalOpen} onClose={handleCloseFiltersModal} />
    </PageTemplate>
  );
};
