import { Col, Row, Tabs, TabsProps } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { formatDurationHms } from '~/utils/format-duration-hms';
import { useGeneralProductivity } from '../../hooks/use-general-productivity';
import { useRefreshContext } from '../../hooks/use-refresh-context';
import { useTotalBreakOvertime } from '../../hooks/use-total-break-overtime';
import { useTotalOnlineTime } from '../../hooks/use-total-online-time';
import { AgentRank } from '../agent-rank';
import { ExceedTimeTab } from '../exceed-time-tab';
import { ExcessiveBreakTab } from '../excessive-break-tab';
import { MetricCard } from '../metric-card';
import { OnlineTimeTab } from '../online-time-tab';
import { OverallProductivityTab } from '../overall-productivity-tab';
import { PeriodSegmented } from '../period-segmented';

export const BreakMetricsTab = () => {
  const { tabId, subTabId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();
  const { refreshKey } = useRefreshContext();
  const { generalProductivity, isFetchingGeneralProductivity, fetchGeneralProductivity } =
    useGeneralProductivity();
  const { totalOnlineTime, isFetchingTotalOnlineTime, fetchTotalOnlineTime } = useTotalOnlineTime();
  const { totalBreakOvertime, isFetchingTotalBreakOvertime, fetchTotalBreakOvertime } =
    useTotalBreakOvertime();

  const { children: breakDashboardRoutes } =
    routes.modules.children.dashboard.children.breakDashboard;

  const activeTab = subTabId || 'overall-productivity';

  const { t } = useTranslation();

  const breakMetricsTabLocaleKeys = localeKeys.dashboard.breakDashboard.components.breakMetricsTab;

  const items: TabsProps['items'] = [
    {
      key: 'overall-productivity',
      label: t(breakMetricsTabLocaleKeys.labelOverallProductivity),
      children: (
        <Row gutter={[16, 16]} wrap={false}>
          <Col span={16}>
            <OverallProductivityTab />
          </Col>
          <Col span={8}>
            <AgentRank />
          </Col>
        </Row>
      ),
    },
    {
      key: 'online-time',
      label: t(breakMetricsTabLocaleKeys.labelOnlineTime),
      children: (
        <Row gutter={[16, 16]} wrap={false}>
          <Col span={24}>
            <OnlineTimeTab />
          </Col>
        </Row>
      ),
    },
    {
      key: 'exceeded-time',
      label: t(breakMetricsTabLocaleKeys.labelExceededTime),
      children: (
        <Row gutter={[16, 16]} wrap={false}>
          <Col span={24}>
            <ExceedTimeTab />
          </Col>
        </Row>
      ),
    },
    {
      key: 'excessive-break',
      label: t(breakMetricsTabLocaleKeys.labelExcessiveBreaks),
      children: (
        <Row gutter={[16, 16]} wrap={false}>
          <Col span={24}>
            <ExcessiveBreakTab />
          </Col>
        </Row>
      ),
    },
  ];

  const handleChangeTab = (tabKey: string) => {
    const pathname = generatePath(breakDashboardRoutes.breakReportTabs.fullPath, {
      workspaceId,
      tabId,
      subTabId: tabKey,
    });
    navigate({ pathname, search: location.search }, { replace: true });
  };

  useEffect(() => {
    fetchGeneralProductivity();
    fetchTotalOnlineTime();
    fetchTotalBreakOvertime();
  }, [fetchGeneralProductivity, fetchTotalBreakOvertime, fetchTotalOnlineTime, refreshKey]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <MetricCard
          title={t(breakMetricsTabLocaleKeys.titleOverallProductivity)}
          description={generalProductivity?.data.total || '0'}
          icon='linechart'
          isLoading={isFetchingGeneralProductivity}
          tooltip={t(breakMetricsTabLocaleKeys.tooltipOverallProductivity)}
        />
      </Col>
      <Col span={8}>
        <MetricCard
          title={t(breakMetricsTabLocaleKeys.titleTotalOnlineTime)}
          description={formatDurationHms(totalOnlineTime?.data.total) || '0min'}
          icon='clock'
          isLoading={isFetchingTotalOnlineTime}
          tooltip={t(breakMetricsTabLocaleKeys.tooltipTotalOnlineTime)}
        />
      </Col>
      <Col span={8}>
        <MetricCard
          title={t(breakMetricsTabLocaleKeys.titleTotalExceededTime)}
          description={formatDurationHms(totalBreakOvertime?.data.total) || '0min'}
          icon='clock'
          isLoading={isFetchingTotalBreakOvertime}
          tooltip={t(breakMetricsTabLocaleKeys.tooltipTotalExceededTime)}
        />
      </Col>
      <Col span={24}>
        <Tabs
          activeKey={activeTab}
          items={items}
          tabBarExtraContent={<PeriodSegmented />}
          destroyInactiveTabPane
          onChange={handleChangeTab}
        />
      </Col>
    </Row>
  );
};
