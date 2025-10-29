import { Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import type { DataType, StatusListProps } from './interfaces';
import { Container } from './styles';

export const StatusList = ({ selectedStatusList, setSelectedStatusList }: StatusListProps) => {
  const { t } = useTranslation();

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleRowClick = (recordKey: string) => {
    let newStatusList = [];

    const statusArrayIndex = selectedStatusList.findIndex((status) => status === recordKey);

    if (statusArrayIndex >= 0) {
      newStatusList = selectedStatusList.filter((status) => status !== recordKey);
    } else {
      newStatusList = [...selectedStatusList, recordKey];
    }

    setSelectedStatusList(newStatusList);
  };

  const columns: ColumnsType<DataType> = [
    {
      title: t(filtersModalLocaleKeys.titleStatusList),
      dataIndex: 'description',
    },
  ];

  const options: DataType[] = [
    {
      key: SendingStatus.CONFIRMED,
      description: t(filtersModalLocaleKeys.confirmedStatus),
    },
    {
      key: SendingStatus.RESCHEDULE,
      description: t(filtersModalLocaleKeys.rescheduledStatus),
    },
    {
      key: SendingStatus.CANCELED,
      description: t(filtersModalLocaleKeys.canceledStatus),
    },
    {
      key: SendingStatus.INDIVIDUAL_CANCEL,
      description: t(filtersModalLocaleKeys.individualCancel),
    },
    {
      key: SendingStatus.START_RESCHEDULE_RECOVER,
      description: t(filtersModalLocaleKeys.startRescheduleRecover),
    },
    {
      key: SendingStatus.CONFIRM_RESCHEDULE_RECOVER,
      description: t(filtersModalLocaleKeys.confirmRescheduleRecover),
    },
    {
      key: SendingStatus.CANCEL_RESCHEDULE_RECOVER,
      description: t(filtersModalLocaleKeys.cancelRescheduleRecover),
    },
    {
      key: SendingStatus.NOT_ANSWERED,
      description: t(filtersModalLocaleKeys.sentStatus),
    },
    {
      key: SendingStatus.OPEN_CVS,
      description: t(filtersModalLocaleKeys.openCsvStatus),
    },
    {
      key: SendingStatus.INVALID,
      description: t(filtersModalLocaleKeys.invalidNumberStatus),
    },
    {
      key: SendingStatus.NO_RECIPIENT,
      description: t(filtersModalLocaleKeys.noRecipient),
    },
    {
      key: SendingStatus.INVALID_RECIPIENT,
      description: t(filtersModalLocaleKeys.invalidRecipíent),
    },
  ];

  const footerActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedStatusList([]);
        }}
      >
        {t(filtersModalLocaleKeys.statusResetButton)}
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
            scroll={{ y: 'calc(40vh - 180px)', scrollToFirstRowOnChange: true }}
            onRow={(record) => {
              return {
                onClick: () => {
                  handleRowClick(record.key);
                },
              };
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedStatusList,
              onChange: (newSelectedRowKeys) => {
                setSelectedStatusList(newSelectedRowKeys as string[]);
              },
            }}
            pagination={{ showTotal: footerActions, pageSize: 20 }}
          />
        </Col>
      </Row>
    </Container>
  );
};
