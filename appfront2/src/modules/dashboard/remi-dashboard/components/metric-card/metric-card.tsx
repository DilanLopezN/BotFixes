import { InfoCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import { Card, Space, Spin, Tooltip, Typography } from 'antd';
import type { MetricCardProps } from './interfaces';

export const MetricCard = ({ title, description, isLoading, tooltip }: MetricCardProps) => {
  const Icon = LineChartOutlined;

  return (
    <Spin spinning={isLoading}>
      <Card>
        <Space direction='vertical' size='middle'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography.Text style={{ fontSize: 18 }}>{title}</Typography.Text>
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoCircleOutlined
                  style={{
                    color: '#1890ff',
                    cursor: 'pointer',
                    fontSize: 16,
                    marginLeft: 8,
                  }}
                />
              </Tooltip>
            )}
          </div>
          <Space align='center'>
            <Icon style={{ fontSize: 24, color: '#1890ff' }} />
            <Typography.Text strong style={{ fontSize: 24 }}>
              {description}
            </Typography.Text>
          </Space>
        </Space>
      </Card>
    </Spin>
  );
};
