import { Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { SendingType } from '~/constants/sending-type';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import type { SendingListQueryString } from '~/modules/dashboard/sending-list/interfaces';
import type { DataType, NpsScoreListProps } from './interfaces';
import { Container } from './styles';

export const NpsScoreList = ({
  selectedNpsScoreList,
  setSelectedNpsScoreList,
}: NpsScoreListProps) => {
  const { t } = useTranslation();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleRowClick = (recordKey: string) => {
    let newNpsScoreList = [];

    const statusArrayIndex = selectedNpsScoreList.findIndex((nps) => nps === recordKey);

    if (statusArrayIndex >= 0) {
      newNpsScoreList = selectedNpsScoreList.filter((nps) => nps !== recordKey);
    } else {
      newNpsScoreList = [...selectedNpsScoreList, recordKey];
    }

    setSelectedNpsScoreList(newNpsScoreList);
  };

  const columns: ColumnsType<DataType> = [
    {
      title: t(filtersModalLocaleKeys.titleNpsScoreList),
      dataIndex: 'score',
    },
  ];

  const options = [
    {
      key: '0',
      score: '0',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '1',
      score: '1',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '2',
      score: '2',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '3',
      score: '3',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '4',
      score: '4',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '5',
      score: '5',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '6',
      score: '6',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '7',
      score: '7',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '8',
      score: '8',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '9',
      score: '9',
      allowedForTypeList: [SendingType.nps_score],
    },
    {
      key: '10',
      score: '10',
      allowedForTypeList: [SendingType.nps_score],
    },
  ].reduce<DataType[]>((previousValue, currentValue) => {
    if (
      !queryStringAsObj.type ||
      currentValue.allowedForTypeList.includes(queryStringAsObj.type as SendingType)
    ) {
      return [...previousValue, { key: currentValue.key, score: currentValue.score }];
    }

    return previousValue;
  }, []);

  const footerActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedNpsScoreList([]);
        }}
      >
        {t(filtersModalLocaleKeys.npsResetButton)}
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
              selectedRowKeys: selectedNpsScoreList,
              onChange: (newSelectedRowKeys) => {
                setSelectedNpsScoreList(newSelectedRowKeys as string[]);
              },
            }}
            pagination={{ showTotal: footerActions, pageSize: 11 }}
          />
        </Col>
      </Row>
    </Container>
  );
};
