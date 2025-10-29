import { Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { useScheduleSettingsWithAlias } from '../../hooks/use-schedule-settings-with-alias';
import type { DataType, NpsScoreListProps } from './interfaces';
import { Container } from './styles';

export const ScheduleWithAliasList = ({
  selectedScheduleSettingWithAliasList,
  setSelectedScheduleSettingWithAliasList,
}: NpsScoreListProps) => {
  const { t } = useTranslation();
  const {
    scheduleSettingsWithAlias,
    isLoadingScheduleSettingsWithAlias,
    fetchScheduleSettingsWithError,
  } = useScheduleSettingsWithAlias();

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const formattedSettingsWithAlias =
    scheduleSettingsWithAlias?.map((item) => {
      return { key: String(item.id), ...item };
    }) || [];

  const options = [{ key: 'ALL', alias: 'Todos' }, ...formattedSettingsWithAlias];

  const columns: ColumnsType<DataType> = [
    {
      title: t(filtersModalLocaleKeys.titleScheduleAliasList),
      dataIndex: 'alias',
    },
  ];

  const selectedRow = useMemo(() => {
    if (selectedScheduleSettingWithAliasList.length === 0) {
      return ['ALL'];
    }

    return selectedScheduleSettingWithAliasList;
  }, [selectedScheduleSettingWithAliasList]);

  const handleRowClick = (recordKey: string[]) => {
    if (recordKey[0] === 'ALL') {
      setSelectedScheduleSettingWithAliasList([]);
      return;
    }

    setSelectedScheduleSettingWithAliasList(recordKey);
  };

  useEffect(() => {
    fetchScheduleSettingsWithError();
  }, [fetchScheduleSettingsWithError]);

  const renderFooterActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedScheduleSettingWithAliasList([]);
        }}
      >
        {t(filtersModalLocaleKeys.scheduleAliasResetButton)}
      </a>
    );
  };

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Table
            dataSource={options}
            columns={columns}
            showHeader
            size='small'
            loading={isLoadingScheduleSettingsWithAlias}
            scroll={{ y: 'calc(40vh - 180px)', scrollToFirstRowOnChange: true }}
            onRow={(record) => {
              return {
                onClick: () => {
                  handleRowClick([record.key]);
                },
              };
            }}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRow,
              onChange: (newSelectedRowKeys) => {
                handleRowClick(newSelectedRowKeys as string[]);
              },
            }}
            pagination={{ showTotal: renderFooterActions, pageSize: 11 }}
          />
        </Col>
      </Row>
    </Container>
  );
};
