import { Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { SendingType } from '~/constants/sending-type';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import type { SendingListQueryString } from '~/modules/dashboard/sending-list/interfaces';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import type { DataType, StatusListProps } from './interfaces';
import { Container } from './styles';

export const StatusList = ({ selectedStatusList, setSelectedStatusList }: StatusListProps) => {
  const { t } = useTranslation();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();

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

  const options = [
    {
      key: SendingStatus.CONFIRMED,
      description: t(filtersModalLocaleKeys.confirmedStatus),
      allowedForTypeList: [SendingType.confirmation],
    },
    {
      key: SendingStatus.OPEN_CVS,
      description: t(filtersModalLocaleKeys.openCsvStatus),
      allowedForTypeList: [
        SendingType.confirmation,
        SendingType.medical_report,
        SendingType.nps,
        SendingType.reminder,
        SendingType.nps_score,
        SendingType.recover_lost_schedule,
      ],
    },
    {
      key: SendingStatus.RESCHEDULE,
      description: t(filtersModalLocaleKeys.rescheduledStatus),
      allowedForTypeList: [SendingType.confirmation],
    },
    {
      key: SendingStatus.NOT_ANSWERED,
      description: t(filtersModalLocaleKeys.notAnsweredStatus),
      allowedForTypeList: [SendingType.confirmation],
    },
    {
      key: SendingStatus.CANCELED,
      description: t(filtersModalLocaleKeys.canceledStatus),
      allowedForTypeList: [SendingType.confirmation],
    },
    {
      key: SendingStatus.INVALID,
      description: t(filtersModalLocaleKeys.invalidNumberStatus),
      allowedForTypeList: [
        SendingType.confirmation,
        SendingType.reminder,
        SendingType.medical_report,
        SendingType.nps,
        SendingType.nps_score,
        SendingType.schedule_notification,
        SendingType.recover_lost_schedule,
      ],
    },
    {
      key: SendingStatus.NO_RECIPIENT,
      description: t(filtersModalLocaleKeys.noRecipient),
      allowedForTypeList: [
        SendingType.confirmation,
        SendingType.reminder,
        SendingType.medical_report,
        SendingType.nps,
        SendingType.nps_score,
        SendingType.schedule_notification,
        SendingType.recover_lost_schedule,
      ],
    },
    {
      key: SendingStatus.INVALID_RECIPIENT,
      description: t(filtersModalLocaleKeys.invalidRecipíent),
      allowedForTypeList: [
        SendingType.confirmation,
        SendingType.reminder,
        SendingType.medical_report,
        SendingType.nps,
        SendingType.nps_score,
        SendingType.schedule_notification,
        SendingType.recover_lost_schedule,
      ],
    },
  ].reduce<DataType[]>((previousValue, currentValue) => {
    if (
      !queryStringAsObj.type ||
      currentValue.allowedForTypeList.includes(queryStringAsObj.type as SendingType)
    ) {
      return [...previousValue, { key: currentValue.key, description: currentValue.description }];
    }

    return previousValue;
  }, []);

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
            pagination={{ showTotal: footerActions }}
          />
        </Col>
      </Row>
    </Container>
  );
};
