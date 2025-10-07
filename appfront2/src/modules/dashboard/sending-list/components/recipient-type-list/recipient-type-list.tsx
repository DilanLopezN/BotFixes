import { Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { RecipientTypeEnum } from '../../constants';
import type { RecipientTypeProps, DataType } from './interfaces';
import { Container } from './styles';

export const RecipientTypeList = ({ recipientType, setRecipientType }: RecipientTypeProps) => {
  const { t } = useTranslation();
  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const options: DataType[] = [
    { key: RecipientTypeEnum.all, description: t(filtersModalLocaleKeys.titleRecipientTypeList) },
    { key: RecipientTypeEnum.email, description: t(filtersModalLocaleKeys.recipientTypeEmail) },
    {
      key: RecipientTypeEnum.whatsApp,
      description: t(filtersModalLocaleKeys.recipientTypeWhatsApp),
    },
  ];

  const handleRowClick = (recordKey: string) => {
    if (recordKey === RecipientTypeEnum.all) {
      setRecipientType(null);
    } else {
      setRecipientType(recordKey as RecipientTypeEnum);
    }
  };

  const columns: ColumnsType<DataType> = [
    {
      dataIndex: 'description',
    },
  ];

  const footerActions = () => (
    <a
      href=' '
      onClick={(event) => {
        event.preventDefault();
        setRecipientType(null);
      }}
    >
      {t(filtersModalLocaleKeys.recipientTypeListResetButton)}
    </a>
  );

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Table
            showHeader={false}
            dataSource={options}
            columns={columns}
            size='small'
            scroll={{ y: 'calc(40vh - 180px)', scrollToFirstRowOnChange: true }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record.key as RecipientTypeEnum),
            })}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: [recipientType ?? RecipientTypeEnum.all],
              onChange: (newSelectedRowKeys) => {
                const selected = newSelectedRowKeys[0];
                if (selected === RecipientTypeEnum.all) {
                  setRecipientType(null);
                } else {
                  setRecipientType(selected as RecipientTypeEnum);
                }
              },
            }}
            pagination={{ showTotal: footerActions, pageSize: 20 }}
            rowKey='key'
          />
        </Col>
      </Row>
    </Container>
  );
};
