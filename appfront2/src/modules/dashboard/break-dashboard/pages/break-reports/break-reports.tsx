import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Tabs, Tooltip, type TabsProps } from 'antd';
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { routes } from '~/routes';
import { AgentStatusTab } from '../../components/agent-status-tab';
import { BreakMetricsTab } from '../../components/break-metrics-tab';
import { FiltersContainer } from '../../components/filters-container';
import { RefreshProvider } from '../../context/refresh-context';

export const BreakReports = () => {
  const { tabId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();

  const { children: breakDashboardRoutes } =
    routes.modules.children.dashboard.children.breakDashboard;

  const activeTab = tabId || 'metrics';

  const handleChangeTab = (tabKey: string) => {
    let pathname = '';

    if (tabKey === 'metrics') {
      pathname = generatePath(breakDashboardRoutes.breakReportTabs.fullPath, {
        workspaceId,
        tabId: tabKey,
        subTabId: 'overall-productivity',
      });
    } else {
      pathname = generatePath(breakDashboardRoutes.breakReports.fullPath, {
        workspaceId,
        tabId: tabKey,
      });
    }

    navigate({ pathname, search: location.search }, { replace: true });
  };

  const items: TabsProps['items'] = [
    {
      key: 'metrics',
      label: 'Métricas',
      children: <BreakMetricsTab />,
    },
    {
      key: 'agent-break-status',
      label: (
        <Flex align='center' gap={8}>
          <span>Agentes</span>
          <Tooltip title='Listas de agentes atualizadas em tempo real'>
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
          </Tooltip>
        </Flex>
      ),
      children: <AgentStatusTab />,
    },
  ];

  return (
    <RefreshProvider>
      <PageTemplate title='Relatórios de Pausas'>
        <Row gutter={[16, 16]} style={{ paddingBottom: 16 }}>
          <Col span={24}>
            <Tabs
              activeKey={activeTab}
              items={items}
              onChange={handleChangeTab}
              destroyInactiveTabPane
              tabBarExtraContent={<FiltersContainer />}
            />
          </Col>
        </Row>
      </PageTemplate>
    </RefreshProvider>
  );
};
