import { Col, Row, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React from 'react';
import { FeedbackEnum } from '../../constants';
import type { DataType, FeedbackListProps } from './interfaces';

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedback, setFeedback }) => {
  const options: DataType[] = [
    { key: FeedbackEnum.all, description: 'Todos' },
    { key: FeedbackEnum.withFeedback, description: 'Com feedback' },
    { key: FeedbackEnum.noFeedback, description: 'Sem feedback' },
  ];

  const handleRowClick = (recordKey: string) => {
    if (recordKey === FeedbackEnum.all) {
      setFeedback(null);
    } else {
      setFeedback(recordKey as FeedbackEnum);
    }
  };

  const columns: ColumnsType<DataType> = [
    {
      dataIndex: 'description',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Table
          showHeader={false}
          dataSource={options}
          columns={columns}
          size='small'
          scroll={{ y: 'calc(40vh - 180px)', scrollToFirstRowOnChange: true }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record.key),
          })}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: [feedback ?? FeedbackEnum.all],
            onChange: (newSelectedRowKeys) => {
              const selected = newSelectedRowKeys[0];
              if (selected === FeedbackEnum.all) {
                setFeedback(null);
              } else {
                setFeedback(selected as FeedbackEnum);
              }
            },
          }}
          pagination={false}
          rowKey='key'
        />
      </Col>
    </Row>
  );
};
