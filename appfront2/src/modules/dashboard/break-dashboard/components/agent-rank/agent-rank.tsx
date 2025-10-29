import { List, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useAgentRank } from '../../hooks/use-agent-rank';
import { useRefreshContext } from '../../hooks/use-refresh-context';

export const AgentRank = () => {
  const { refreshKey } = useRefreshContext();
  const { agentRank, isFetchingAgentRank, fetchAgentRank } = useAgentRank();

  const sortedAgents = useMemo(() => {
    if (!agentRank) return [];

    return agentRank
      .map((item) => {
        return { name: item.userName, productivity: item.agg_result };
      })
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 10);
  }, [agentRank]);

  useEffect(() => {
    fetchAgentRank();
  }, [fetchAgentRank, refreshKey]);

  return (
    <Spin spinning={isFetchingAgentRank}>
      <List
        header={<Typography.Text strong>🏆 Top 10 agentes com maior produtividade</Typography.Text>}
        style={{ backgroundColor: '#fff', borderRadius: 8 }}
        bordered
        dataSource={sortedAgents}
        renderItem={(item, index) => (
          <List.Item>
            <Space>
              <div style={{ width: 24 }}>
                <Typography.Text strong>{index + 1}º</Typography.Text>
              </div>
              <Typography.Text>{item.name}</Typography.Text>
            </Space>
            <Tag color='green'>{item.productivity}</Tag>
          </List.Item>
        )}
      />
    </Spin>
  );
};
