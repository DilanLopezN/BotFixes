import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Popover, Row, Space, Spin, Tooltip, Typography } from 'antd';
import type { ColumnType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { EnhancedTable } from '~/components/enhanced-table';
import { formatDurationHms } from '~/utils/format-duration-hms';
import { useExcessiveBreaks } from '../../hooks/use-excessive-breaks';
import { useRefreshContext } from '../../hooks/use-refresh-context';

export const ExcessiveBreakTab = () => {
  const { refreshKey } = useRefreshContext();
  const { excessiveBreaks, isFetchingExcessiveBreaks, fetchExcessiveBreaks } = useExcessiveBreaks();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const columns: ColumnType<any>[] = [
    {
      title: 'Agente',
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: 'Data',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (text: string) => {
        return dayjs(text).format('DD/MM/YYYY HH:mm');
      },
    },
    {
      title: 'Nome da pausa',
      dataIndex: 'breakName',
      key: 'breakName',
      render: (value: string) => {
        if (!value) {
          return <span style={{ color: '#999' }}>Pausa automática</span>;
        }

        return <span>{value}</span>;
      },
    },
    {
      title: 'Tempo excedido',
      dataIndex: 'overtimeSeconds',
      key: 'overtimeSeconds',
      render: (text: number) => {
        return formatDurationHms(text);
      },
    },
    {
      title: 'Justificativa',
      dataIndex: 'justification',
      key: 'justification',
      render: (text: string | undefined) => {
        if (text) {
          return (
            <Popover content={text} title='Descrição' trigger='click' overlayStyle={{ width: 400 }}>
              <Button type='text' block>
                <Typography.Text ellipsis>{text}</Typography.Text>
              </Button>
            </Popover>
          );
        }

        return (
          <Space>
            <Tooltip title='Usuário foi desconectado por inatividade'>
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
            <span style={{ color: '#999' }}>Sem justificativa</span>
          </Space>
        );
      },
    },
  ];

  const handleTableChange: TableProps['onChange'] = (newPagination) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  useEffect(() => {
    fetchExcessiveBreaks({ pageSize: pagination.pageSize, current: pagination.current });
  }, [fetchExcessiveBreaks, pagination, refreshKey]);

  return (
    <Spin spinning={isFetchingExcessiveBreaks}>
      <Card>
        <Row justify='center' style={{ marginBottom: 16 }}>
          <Col>
            <b style={{ margin: 0, fontSize: '1.3em' }}>Pausas excedidas</b>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <EnhancedTable
              columns={columns}
              dataSource={excessiveBreaks?.data || []}
              pagination={{ ...pagination, total: excessiveBreaks?.metadata?.count || 0 }}
              onChange={handleTableChange}
              bordered
              size='small'
              shouldAlwaysAddHeight
              addExtraPaddingIfEmpty={false}
              scroll={{ y: 'calc(100vh - 560px)' }}
            />
          </Col>
        </Row>
      </Card>
    </Spin>
  );
};
