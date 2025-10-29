import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Row, Select, type SelectProps, Space, Spin, Tag, Tooltip } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { EnhancedTable } from '~/components/enhanced-table';
import { AgentStatus } from '~/services/workspace/get-agent-status';
import { formatDurationHms } from '~/utils/format-duration-hms';
import { normalizeText } from '~/utils/normalize-text';
import { useAgentStatusList } from '../../hooks/use-agent-status-list';
import { useBreaks } from '../../hooks/use-breaks';
import { useRefreshContext } from '../../hooks/use-refresh-context';
import { ChangeAgentStatusModal } from '../change-agent-status-modal';

export const AgentStatusTab = () => {
  const { refreshKey } = useRefreshContext();
  const { agentStatusList, isFetchingAgentStatusList, fetchAgentStatusList } = useAgentStatusList();
  const { breaks, isFetchingBreaks, fetchBreaks } = useBreaks();
  const [selectedOnlineRowKeys, setSelectedOnlineRowKeys] = useState<string[]>([]);
  const [selectedBreak, setSelectedBreak] = useState<{ value: number; label: string }>();
  const [isChangeAgentStatusModalOpen, setIsChangeAgentStatusModalOpen] = useState(false);

  const isSelectEnabled = selectedOnlineRowKeys.length > 0;

  const options = useMemo(() => {
    const opt = { value: -1, label: `Offline`, name: `Offline` };

    const filteredBreaks = breaks
      ? breaks
          .filter((item) => Boolean(item.enabled))
          .map((item) => {
            return {
              value: item.id,
              label: `${item.name} - ${item.durationSeconds / 60} minutos`,
              name: item.name,
            };
          })
      : [];

    return [opt, ...filteredBreaks];
  }, [breaks]);

  const onlineColumns: ColumnsType<AgentStatus['online']> = [
    {
      title: 'Nome',
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Tempo</span>
          <Tooltip title='Tempo que o usuário está online desde a última pausa'>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16, cursor: 'pointer' }} />
          </Tooltip>
        </div>
      ),
      dataIndex: 'breakTimeSeconds',
      key: 'breakTimeSeconds',
      ellipsis: true,
      render: (value: number) => {
        return <span>{value ? formatDurationHms(value) : '0seg'}</span>;
      },
    },
  ];

  const pausedColumns: ColumnsType<AgentStatus['break']> = [
    {
      title: 'Nome',
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: 'Pausa',
      dataIndex: 'breakName',
      key: 'breakName',
      ellipsis: true,
      render: (value: string) => {
        if (!value) {
          return <span style={{ color: '#999' }}>Pausa automática</span>;
        }

        return <span>{value}</span>;
      },
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Tempo</span>
          <Tooltip title='Tempo total que o usuário está pausado (tempo da pausa + tempo excedente)'>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16, cursor: 'pointer' }} />
          </Tooltip>
        </div>
      ),
      dataIndex: 'breakTimeSeconds',
      key: 'breakTimeSeconds',
      ellipsis: true,
      render: (value: number) => {
        return <span>{value ? formatDurationHms(value) : '0seg'}</span>;
      },
    },
    {
      title: 'Excedido',
      dataIndex: 'breakOvertimeSeconds',
      key: 'breakOvertimeSeconds',
      ellipsis: true,
      render: (value: number) => {
        const hasOvertime = value > 0;

        return (
          <span style={hasOvertime ? { color: 'red' } : undefined}>
            {value ? formatDurationHms(value) : '0seg'}
          </span>
        );
      },
    },
  ];

  const offlineCollumns: ColumnsType<AgentStatus['offline']> = [
    {
      title: 'Nome',
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Tempo</span>
          <Tooltip title='Tempo total desde que o usuário foi desconectado'>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16, cursor: 'pointer' }} />
          </Tooltip>
        </div>
      ),
      dataIndex: 'breakTimeSeconds',
      key: 'breakTimeSeconds',
      ellipsis: true,
      render: (value) => {
        return <span>{value ? formatDurationHms(value) : '0seg'}</span>;
      },
    },
  ];

  const handleSelectBreak: SelectProps['onChange'] = (breakId, option) => {
    setSelectedBreak(option as { value: number; label: string });
    setIsChangeAgentStatusModalOpen(true);
  };

  const handleCloseChangeAgentStatusModal = () => {
    setIsChangeAgentStatusModalOpen(false);
    setSelectedBreak(undefined);
  };

  useEffect(() => {
    fetchAgentStatusList();
    fetchBreaks();
  }, [fetchAgentStatusList, fetchBreaks, refreshKey]);

  return (
    <Row gutter={16}>
      <Col span={7}>
        <Spin spinning={isFetchingAgentStatusList}>
          <Card
            title={
              <Row justify='space-between' align='middle'>
                <Col>
                  <Space>
                    <UserOutlined />
                    <span>Agentes online</span>
                  </Space>
                </Col>
                <Col>
                  <Tag color='green'>{agentStatusList?.data.online.length} usuários</Tag>
                </Col>
              </Row>
            }
          >
            <Select
              placeholder='Alterar selecionados'
              options={options}
              loading={isFetchingBreaks}
              disabled={!isSelectEnabled}
              style={{ width: '100%', marginBottom: 8 }}
              value={selectedBreak?.value}
              onChange={handleSelectBreak}
              showSearch
              autoClearSearchValue={false}
              filterOption={(search, option) => {
                return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
              }}
            />
            <EnhancedTable
              rowKey='userId'
              dataSource={agentStatusList?.data.online || []}
              columns={onlineColumns}
              rowSelection={{
                selectedRowKeys: selectedOnlineRowKeys,
                onChange: (keys) => setSelectedOnlineRowKeys(keys as string[]),
              }}
              pagination={false}
              size='small'
              scroll={{ y: 'calc(100vh - 350px)' }}
              shouldAlwaysAddHeight
              addExtraPaddingIfEmpty={false}
            />
          </Card>
        </Spin>
      </Col>
      <Col span={10}>
        <Spin spinning={isFetchingAgentStatusList}>
          <Card
            title={
              <Row justify='space-between' align='middle'>
                <Col>
                  <Space>
                    <UserOutlined />
                    <span>Agentes em pausa</span>
                  </Space>
                </Col>
                <Col>
                  <Tag color='yellow'>{agentStatusList?.data.break.length} usuários</Tag>
                </Col>
              </Row>
            }
          >
            <EnhancedTable
              rowKey='userId'
              dataSource={agentStatusList?.data.break || []}
              columns={pausedColumns}
              pagination={false}
              size='small'
              scroll={{ y: 'calc(100vh - 310px)' }}
              shouldAlwaysAddHeight
              addExtraPaddingIfEmpty={false}
            />
          </Card>
        </Spin>
      </Col>
      <Col span={7}>
        <Spin spinning={isFetchingAgentStatusList}>
          <Card
            title={
              <Row justify='space-between' align='middle'>
                <Col>
                  <Space>
                    <UserOutlined />
                    <span>Agentes offline</span>
                  </Space>
                </Col>
                <Col>
                  <Tag color='red'>{agentStatusList?.data.offline.length} usuários</Tag>
                </Col>
              </Row>
            }
          >
            <EnhancedTable
              rowKey='userId'
              dataSource={agentStatusList?.data.offline || []}
              columns={offlineCollumns}
              pagination={false}
              size='small'
              scroll={{ y: 'calc(100vh - 310px)' }}
              shouldAlwaysAddHeight
              addExtraPaddingIfEmpty={false}
            />
          </Card>
        </Spin>
      </Col>
      <ChangeAgentStatusModal
        isOpen={isChangeAgentStatusModalOpen}
        selectedAgentIds={selectedOnlineRowKeys}
        setSelectedAgentIds={setSelectedOnlineRowKeys}
        onClose={handleCloseChangeAgentStatusModal}
        fetchAgentStatusList={fetchAgentStatusList}
        selectedBreak={selectedBreak}
        setSelectedBreak={setSelectedBreak}
      />
    </Row>
  );
};
