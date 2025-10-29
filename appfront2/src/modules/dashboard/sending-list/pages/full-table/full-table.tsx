import {
  ExportOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PieChartFilled,
  PieChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Dropdown,
  Flex,
  Input,
  MenuProps,
  Modal,
  Popover,
  Row,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import { SearchProps } from 'antd/es/input';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router-dom';
import { EnhancedTable, EnhancedTableRef } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { SendingType } from '~/constants/sending-type';
import { useAuth } from '~/hooks/use-auth';
import { useQueryString } from '~/hooks/use-query-string';
import { useWindowSize } from '~/hooks/use-window-size';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { ExportableFields } from '~/services/workspace/export-list-schedules-csv/interfaces';
import { TypeDownloadEnum } from '~/services/workspace/export-list-schedules-csv/type-download-enum';
import { SendingListData } from '~/services/workspace/get-sending-list-by-workspace-id';
import { notifyError } from '~/utils/notify-error';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { ConversationPreviewModal } from '../../../../../components/conversation-preview-modal';
import { FiltersModal } from '../../components/filters-modal';
import {
  DEFAULT_TABLE_COLUMNS,
  RecipientTypeEnum,
  sendTypeColumLabelMap,
  statusColumLabelMap,
  TableColumnConfig,
} from '../../constants';
import { CancelingReasonProvider } from '../../contexts/canceling-reasons-context';
import { useCancelingReasonContext } from '../../hooks/use-canceling-reason-context';
import { useExportSchedules } from '../../hooks/use-export-list-schedules';
import { useSendingList } from '../../hooks/use-sending-list';
import { SendingListQueryString } from '../../interfaces';
import { ChartContainer } from './chart-container';
import { allowedQueries, chartWidth, maxScreenSizeToCompactActions } from './constants';
import { ScheduleTypeSelect } from './styles';

export const FullTableComponent = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { queryStringAsObj, updateQueryString } = useQueryString<SendingListQueryString>({
    allowedQueries,
  });
  const { width: screenWidth } = useWindowSize();

  // NOVO: Estados para controle de exportação com colunas configuráveis
  const [exportColumns, setExportColumns] = useState<TableColumnConfig[]>(DEFAULT_TABLE_COLUMNS);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<TypeDownloadEnum>();

  // ATUALIZADO: Passar configuração de colunas para o hook
  const { exportSchedules, isLoading: isLoadingExportCsv } = useExportSchedules();

  const { workspaceId } = useParams<{ workspaceId: string }>();
  const tableRef = useRef<EnhancedTableRef>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState(queryStringAsObj.search || '');
  const [isFiltersModalOpen, setIsFilterModalOpen] = useState(false);
  const [isConversationPreviewModalOpen, setIsConversationPreviewModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [filterCount, setFilterCount] = useState(0);
  const { cancelingReasons } = useCancelingReasonContext();
  const selectedSendType = queryStringAsObj.type;
  const hasAdminAccess =
    !!user &&
    (isAnySystemAdmin(user) || (workspaceId ? isWorkspaceAdmin(user, workspaceId) : false));

  const shouldCompactTableActions =
    screenWidth < maxScreenSizeToCompactActions ||
    (isDrawerOpen && screenWidth < maxScreenSizeToCompactActions + chartWidth);

  const { sendingList, isLoading } = useSendingList();

  const { sendingList: sendingListRoute } = routes.modules.children.dashboard.children;
  const { fullTable: fullTableLocaleKeys } = localeKeys.dashboard.sendingList;

  const { Text } = Typography;

  const dashboardPath = useMemo(() => {
    return generatePath(sendingListRoute.fullPath, { workspaceId });
  }, [sendingListRoute.fullPath, workspaceId]);

  const getVisibleColumns = useCallback((columns: TableColumnConfig[]): ExportableFields[] => {
    return columns.filter((col) => col.visible || col.required).map((col) => col.key);
  }, []);

  const handleColumnVisibilityChange = useCallback(
    (columnKey: ExportableFields, visible: boolean) => {
      setExportColumns((prev) =>
        prev.map((col) => (col.key === columnKey ? { ...col, visible } : col))
      );
    },
    []
  );

  const handleExportClick = useCallback((downloadType: TypeDownloadEnum) => {
    setPendingExportType(downloadType);
    setIsExportModalVisible(true);
  }, []);

  const handleConfirmExport = useCallback(async () => {
    if (pendingExportType) {
      const selectedColumns = getVisibleColumns(exportColumns);
      await exportSchedules(pendingExportType, selectedColumns);
      setIsExportModalVisible(false);
      setPendingExportType(undefined);
    }
  }, [pendingExportType, exportColumns, exportSchedules, getVisibleColumns]);

  const handleChangeSelect = (newSendingType: unknown) => {
    updateQueryString({ type: newSendingType, currentPage: 1 });
  };

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

  const handleOpenConversationPreviewModal = (conversationId: string) => {
    if (!workspaceId) {
      notifyError(t(fullTableLocaleKeys.noWorkspaceServiceLinkError));
      return;
    }

    if (!conversationId) {
      notifyError(t(fullTableLocaleKeys.noConversationIdServiceLinkError));
      return;
    }

    setIsConversationPreviewModalOpen(true);
    setSelectedConversationId(conversationId);
  };

  const handleCloseConversationPreviewModal = () => {
    setIsConversationPreviewModalOpen(false);
    setSelectedConversationId(undefined);
  };

  const handleChartButtonClick = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleGroupSwitchChange = useCallback(
    (checked: boolean) => {
      updateQueryString({
        getGroup: checked ? 'true' : 'false',
        currentPage: 1,
      });
    },
    [updateQueryString]
  );

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'xlsx',
      label: 'Excel (.xlsx)',
      onClick: () => handleExportClick(TypeDownloadEnum.XLSX),
    },
    {
      key: 'csv',
      label: 'CSV (.csv)',
      onClick: () => handleExportClick(TypeDownloadEnum.CSV),
    },
  ];

  useEffect(() => {
    if (
      dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD', true).isValid() &&
      dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD', true).isValid()
    ) {
      return;
    }
    const newStartDate = dayjs().subtract(3, 'days').format('YYYY-MM-DD');
    const newEndDate = dayjs().add(3, 'days').format('YYYY-MM-DD');
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  }, [queryStringAsObj.endDate, queryStringAsObj.startDate, updateQueryString]);

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

  useEffect(() => {
    if (!queryStringAsObj.getGroup) {
      updateQueryString({ getGroup: 'true' });
    }
  }, [queryStringAsObj.getGroup, updateQueryString]);

  useEffect(() => {
    setFilterCount(
      (queryStringAsObj.specialityCodeList?.split(',').length || 0) +
        (queryStringAsObj.doctorCodeList?.split(',').length || 0) +
        (queryStringAsObj.statusList?.split(',').length || 0) +
        (queryStringAsObj.procedureCodeList?.split(',').length || 0) +
        (queryStringAsObj.cancelReasonList?.split(',').length || 0) +
        (queryStringAsObj.insuranceCodeList?.split(',').length || 0) +
        (queryStringAsObj.insurancePlanCodeList?.split(',').length || 0) +
        (queryStringAsObj.organizationUnitList?.split(',').length || 0) +
        (queryStringAsObj.npsScoreList?.split(',').length || 0) +
        (queryStringAsObj.recipientType?.split(',').length || 0) +
        (queryStringAsObj.feedback?.split(',').length || 0) +
        (queryStringAsObj.aliasSettingId?.split(',').length || 0)
    );
  }, [
    queryStringAsObj.aliasSettingId,
    queryStringAsObj.cancelReasonList,
    queryStringAsObj.doctorCodeList,
    queryStringAsObj.feedback,
    queryStringAsObj.insuranceCodeList,
    queryStringAsObj.insurancePlanCodeList,
    queryStringAsObj.npsScoreList,
    queryStringAsObj.organizationUnitList,
    queryStringAsObj.procedureCodeList,
    queryStringAsObj.recipientType,
    queryStringAsObj.specialityCodeList,
    queryStringAsObj.statusList,
  ]);

  const actionsContainer = (
    <Space>
      <Link to={dashboardPath} replace>
        <Button>{t(fullTableLocaleKeys.backToDashboardButton)}</Button>
      </Link>
    </Space>
  );

  const newFunction = (col: TableColumnConfig): boolean => {
    return !!col.required;
  };

  const getPopoverMenuItems = (record: SendingListData): MenuProps['items'] => {
    const { conversationId, sendType, data, recipientType } = record;

    const isConversationActionDisabled =
      !conversationId || recipientType === RecipientTypeEnum.email;
    const tooltipMessage = t(fullTableLocaleKeys.noConversationGeneratedTooltip);

    const liveAgentpath = getBaseUrl({
      pathname: '/live-agent',
      appTypePort: AppTypePort.APP,
      queryString: `?workspace=${workspaceId}&conversation=${conversationId}`,
      addExtraQueries: false,
    });

    const items: MenuProps['items'] = [];

    const viewConversationItem = {
      key: '1',
      disabled: isConversationActionDisabled,
      label: (
        <Tooltip title={isConversationActionDisabled ? tooltipMessage : ''}>
          <span>{t(fullTableLocaleKeys.servicePreviewButton)}</span>
        </Tooltip>
      ),
      onClick: () => {
        if (!isConversationActionDisabled) {
          handleOpenConversationPreviewModal(conversationId);
        }
      },
    };

    const goToConversationItem = {
      key: '2',
      disabled: isConversationActionDisabled,
      label: isConversationActionDisabled ? (
        <Tooltip title={tooltipMessage}>
          <span>{t(fullTableLocaleKeys.goToConversationPopoverMenu)}</span>
        </Tooltip>
      ) : (
        <Link to={liveAgentpath} target='_blank' rel='noopener noreferrer'>
          {t(fullTableLocaleKeys.goToConversationPopoverMenu)}
        </Link>
      ),
    };

    if (shouldCompactTableActions) {
      items.push(viewConversationItem, goToConversationItem);
    } else {
      items.push(goToConversationItem);
    }

    if (sendType === SendingType?.schedule_notification && data?.PREPARO_URL && hasAdminAccess) {
      items.unshift({
        key: '3',
        label: (
          <Link to={data.PREPARO_URL} target='_blank' rel='noopener noreferrer'>
            {t(fullTableLocaleKeys.accessScheduleScreen)}
          </Link>
        ),
      });
    }

    return items;
  };

  const columns: ColumnType<SendingListData>[] = [
    {
      title: t(fullTableLocaleKeys.patientCodeColumn),
      dataIndex: 'patientCode',
      key: 'patientCode',
      width: 150,
    },
    {
      title: (
        <Space>
          {t(fullTableLocaleKeys.patientNameColumn)}
          <Tooltip title={t(fullTableLocaleKeys.infoPatientNameColumn)}>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 14, cursor: 'pointer' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'patientName',
      key: 'patientName',
      width: 200,
      render: (patientName, record) => {
        const patientInfo = (
          <Space direction='vertical'>
            <Text>
              <strong>{t(fullTableLocaleKeys.patientName)}:</strong> {record.patientName}
            </Text>
            <Text>
              <strong>{t(fullTableLocaleKeys.patientCode)}:</strong> {record.patientCode}
            </Text>
            <Text>
              <strong>{t(fullTableLocaleKeys.patientEmail)}:</strong> {record.patientEmail}
            </Text>
            <Text>
              <strong>{t(fullTableLocaleKeys.patientPhone)}:</strong> {record.patientPhone}
            </Text>
          </Space>
        );
        return (
          <Popover
            content={patientInfo}
            title={t(fullTableLocaleKeys.patientInfo)}
            trigger='click'
            overlayStyle={{ width: 300 }}
          >
            <Button type='text' block style={{ textAlign: 'left' }}>
              <Text ellipsis>{patientName}</Text>
            </Button>
          </Popover>
        );
      },
    },
    {
      title: t(fullTableLocaleKeys.doctorNameColumn),
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.scheduleDateColumn),
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      width: 170,
      render: (scheduleDate) => {
        return dayjs(scheduleDate).format('DD/MM/YYYY HH:mm');
      },
    },
    {
      title: t(fullTableLocaleKeys.statusColumn),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_status, sending) => {
        const status = sending.status ? statusColumLabelMap[sending.status] : undefined;
        return status ? t(status.label) : t(fullTableLocaleKeys.statusEmpty);
      },
    },
    {
      title: t(fullTableLocaleKeys.typeColumn),
      dataIndex: 'sendType',
      key: 'sendType',
      width: 170,
      render: (_sendType, sending) => {
        return sending.sendType ? t(sendTypeColumLabelMap[sending.sendType]) : '';
      },
    },
    {
      title: t(fullTableLocaleKeys.procedureName),
      dataIndex: 'procedureName',
      key: 'procedureName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.appointmentTypeName),
      dataIndex: 'appointmentTypeName',
      key: 'appointmentTypeName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.organizationUnitName),
      dataIndex: 'organizationUnitName',
      key: 'organizationUnitName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.insuranceName),
      dataIndex: 'insuranceName',
      key: 'insuranceName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.insurancePlanName),
      dataIndex: 'insurancePlanName',
      key: 'insurancePlanName',
      width: 200,
    },
    {
      title: t(fullTableLocaleKeys.cancelingReasonColumn),
      dataIndex: 'reasonId',
      key: 'reasonId',
      width: 200,
      render: (reasonId) => {
        const selectedCancelingReason = cancelingReasons?.find(
          (cancelingReason) => cancelingReason.id === reasonId
        );
        return selectedCancelingReason ? selectedCancelingReason.reasonName : '';
      },
    },
    {
      title: t(fullTableLocaleKeys.recipientType),
      dataIndex: 'recipientType',
      key: 'recipientType',
      width: 150,
    },
    {
      title: t(fullTableLocaleKeys.npsScore),
      dataIndex: 'npsScore',
      key: 'npsScore',
      width: 200,
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: { showTitle: true },
      width: 200,
      render: (feedback) => {
        return (
          <Popover
            content={feedback}
            title='Feedback'
            trigger='click'
            overlayStyle={{ width: 400 }}
          >
            <Button type='text' block>
              <Text ellipsis>{feedback}</Text>
            </Button>
          </Popover>
        );
      },
    },
    {
      title: '',
      width: shouldCompactTableActions ? 60 : 160,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      render: (_actions, record) => {
        const isConversationActionDisabled =
          !record.conversationId || record.recipientType === RecipientTypeEnum.email;
        const tooltipMessage = t(fullTableLocaleKeys.noConversationGeneratedTooltip);
        return (
          <Space>
            {!shouldCompactTableActions && (
              <Tooltip title={isConversationActionDisabled ? tooltipMessage : ''}>
                <Button
                  disabled={isConversationActionDisabled}
                  onClick={() => {
                    handleOpenConversationPreviewModal(record?.conversationId);
                  }}
                >
                  {t(fullTableLocaleKeys.servicePreviewButton)}
                </Button>
              </Tooltip>
            )}
            <Dropdown menu={{ items: getPopoverMenuItems(record) }} placement='bottomLeft'>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const filteredColumns = columns.filter((col) => {
    if (!selectedSendType) {
      return true;
    }
    if (col.dataIndex === 'reasonId' && selectedSendType !== SendingType.confirmation) {
      return false;
    }
    if (
      (col.dataIndex === 'npsScore' || col.dataIndex === 'feedback') &&
      selectedSendType !== SendingType.nps_score
    ) {
      return false;
    }
    return true;
  });

  return (
    <>
      <PageTemplate title={t(fullTableLocaleKeys.pageTitle)} actionButtons={actionsContainer}>
        <Row gutter={16} wrap={false} style={{ paddingBottom: 16 }}>
          {isDrawerOpen && (
            <Col flex={`${chartWidth}px`}>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <ChartContainer />
              </div>
            </Col>
          )}
          <Col flex='auto'>
            <div
              style={{
                position: 'fixed',
                width: `calc(100vw - 320px - ${isDrawerOpen ? chartWidth : 0}px)`,
                height: '100vh',
                top: 81,
                right: 30,
              }}
            >
              <Card styles={{ body: { paddingBottom: 0 } }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Flex justify='space-between' gap={16}>
                      <Space>
                        <Tooltip
                          title={
                            isDrawerOpen
                              ? t(fullTableLocaleKeys.tooltipHideCharts)
                              : t(fullTableLocaleKeys.tooltipViewCharts)
                          }
                        >
                          <Button onClick={handleChartButtonClick}>
                            {isDrawerOpen ? <PieChartFilled /> : <PieChartOutlined />}
                          </Button>
                        </Tooltip>
                        <ScheduleTypeSelect
                          value={selectedSendType || ''}
                          onChange={handleChangeSelect}
                          popupMatchSelectWidth={false}
                        >
                          <Select.Option value=''>
                            {t(fullTableLocaleKeys.allSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.confirmation}>
                            {t(fullTableLocaleKeys.confirmationsSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.nps}>
                            {t(fullTableLocaleKeys.npsSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.reminder}>
                            {t(fullTableLocaleKeys.remindersSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.medical_report}>
                            {t(fullTableLocaleKeys.medicalReportSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.schedule_notification}>
                            {t(fullTableLocaleKeys.scheduleNotificationSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.nps_score}>
                            {t(fullTableLocaleKeys.npsScoreSelectOption)}
                          </Select.Option>
                          <Select.Option value={SendingType.recover_lost_schedule}>
                            {t(fullTableLocaleKeys.recoverLostScheduleSelectOption)}
                          </Select.Option>
                        </ScheduleTypeSelect>
                        <DatePicker.RangePicker
                          allowClear={false}
                          format='DD/MM/YYYY'
                          style={{ width: 230 }}
                          onChange={handleChangeDateRangePicker}
                          value={[
                            dayjs(queryStringAsObj.startDate),
                            dayjs(queryStringAsObj.endDate),
                          ]}
                          placeholder={[
                            t(fullTableLocaleKeys.rangeDatePickerStartDatePlaceholder),
                            t(fullTableLocaleKeys.rangeDatePickerEndDatePlaceholder),
                          ]}
                        />
                        <Tooltip title={t(fullTableLocaleKeys.tooltipViewGrouped)}>
                          <span>{t(fullTableLocaleKeys.spanViewGrouped)}</span>
                        </Tooltip>
                        <Switch
                          size='small'
                          checked={queryStringAsObj.getGroup === 'true'}
                          onChange={handleGroupSwitchChange}
                        />
                      </Space>
                      <Space>
                        <Input.Search
                          placeholder={t(fullTableLocaleKeys.searchInputPlaceholder)}
                          value={searchInputValue}
                          onChange={(e) => {
                            setSearchInputValue(e.target.value);
                          }}
                          allowClear
                          onSearch={handleSearch}
                        />
                        <Tooltip
                          title={
                            shouldCompactTableActions
                              ? t(fullTableLocaleKeys.filterButton)
                              : undefined
                          }
                        >
                          <Button
                            icon={<FilterOutlined />}
                            onClick={() => {
                              setIsFilterModalOpen(true);
                            }}
                          >
                            {!shouldCompactTableActions ? (
                              <Space align='center'>
                                {t(fullTableLocaleKeys.filterButton)}
                                {filterCount > 0 && <Badge count={filterCount} />}
                              </Space>
                            ) : (
                              filterCount > 0 && <Badge count={filterCount} />
                            )}
                          </Button>
                        </Tooltip>
                        <Tooltip
                          title={
                            shouldCompactTableActions
                              ? t(fullTableLocaleKeys.configureListButton)
                              : undefined
                          }
                        >
                          <Button
                            icon={<SettingOutlined />}
                            onClick={() => {
                              tableRef.current?.openColumnConfig();
                            }}
                          >
                            {!shouldCompactTableActions &&
                              t(fullTableLocaleKeys.configureListButton)}
                          </Button>
                        </Tooltip>
                        {/* ATUALIZADO: Botão de exportação com dropdown */}
                        <Dropdown
                          menu={{ items: exportMenuItems }}
                          trigger={['click']}
                          placement='bottomRight'
                        >
                          <Tooltip
                            title={
                              shouldCompactTableActions
                                ? t(fullTableLocaleKeys.exportButton)
                                : undefined
                            }
                          >
                            <Button icon={<ExportOutlined />} loading={isLoadingExportCsv}>
                              {!shouldCompactTableActions && t(fullTableLocaleKeys.exportButton)}
                            </Button>
                          </Tooltip>
                        </Dropdown>
                      </Space>
                    </Flex>
                  </Col>
                  <Col span={24}>
                    <EnhancedTable
                      ref={tableRef}
                      rowKey={(row) => row.id}
                      id='campaigns::confirmation-sending-list-table'
                      columns={filteredColumns}
                      dataSource={sendingList?.data}
                      loading={isLoading}
                      bordered
                      pagination={{
                        total: sendingList?.count,
                        current: Number(queryStringAsObj.currentPage || 1),
                        pageSize: Number(queryStringAsObj.pageSize || 10),
                        onChange: handleChangePage,
                        showTotal: (total) =>
                          total > 1
                            ? `${total} ${t(fullTableLocaleKeys.tableTotalPluralMessage)}`
                            : `${total} ${t(fullTableLocaleKeys.tableTotalSingularMessage)}`,
                      }}
                      scroll={{
                        y: 'calc(100vh - 290px)',
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          </Col>
        </Row>
        <FiltersModal
          isVisible={isFiltersModalOpen}
          onClose={() => {
            setIsFilterModalOpen(false);
          }}
        />
        <ConversationPreviewModal
          isVisible={isConversationPreviewModalOpen}
          conversationId={selectedConversationId}
          onClose={handleCloseConversationPreviewModal}
        />
      </PageTemplate>

      <Modal
        title='Configurar Colunas para Exportação'
        open={isExportModalVisible}
        onOk={handleConfirmExport}
        onCancel={() => {
          setIsExportModalVisible(false);
          setPendingExportType(undefined);
        }}
        confirmLoading={isLoadingExportCsv}
        width={700}
        okText='Exportar'
        cancelText='Cancelar'
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        <Space direction='vertical' style={{ width: '100%', marginBottom: 16 }}>
          <Typography.Text type='secondary'>
            Selecione as colunas que deseja incluir no arquivo de exportação. Os campos obrigatórios
            serão sempre incluídos.
          </Typography.Text>

          {pendingExportType && (
            <Typography.Text strong>
              Formato selecionado:{' '}
              {pendingExportType === TypeDownloadEnum.XLSX ? 'Excel (.xlsx)' : 'CSV (.csv)'}
            </Typography.Text>
          )}
        </Space>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          {exportColumns.map((column) => (
            <div key={column.key} style={{ padding: '8px' }}>
              <Checkbox
                checked={column.visible}
                disabled={column.required}
                onChange={(e) => handleColumnVisibilityChange(column.key, e.target.checked)}
              >
                <span style={{ fontSize: '14px' }}>
                  {column.label}
                  {column.required && (
                    <Typography.Text
                      type='secondary'
                      style={{
                        marginLeft: 8,
                        fontSize: '12px',
                        fontStyle: 'italic',
                      }}
                    >
                      (obrigatório)
                    </Typography.Text>
                  )}
                </span>
              </Checkbox>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '12px',
            backgroundColor: '#e6f7ff',
            borderRadius: '4px',
            border: '1px solid #91d5ff',
          }}
        >
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Typography.Text type='secondary' style={{ fontSize: '12px' }}>
              <strong>Campos obrigatórios:</strong> Nome do Paciente, Código do Paciente, Email e
              Telefone serão sempre exportados para garantir a integridade dos dados.
            </Typography.Text>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button
              size='small'
              onClick={() => {
                setExportColumns((prev) => prev.map((col) => ({ ...col, visible: true })));
              }}
            >
              Selecionar Todos
            </Button>
            <Button
              size='small'
              onClick={() => {
                setExportColumns((prev) =>
                  prev.map((col) => ({
                    ...col,
                    visible: newFunction(col),
                  }))
                );
              }}
            >
              Limpar Seleção
            </Button>
          </Space>
        </div>
      </Modal>
    </>
  );
};

export const FullTable = () => {
  return (
    <CancelingReasonProvider>
      <FullTableComponent />
    </CancelingReasonProvider>
  );
};
