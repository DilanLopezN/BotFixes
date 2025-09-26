/* eslint-disable react/no-this-in-sfc */
import { Button, Col, Divider, Flex, Space, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact, { type HighchartsReactProps } from 'highcharts-react-official';
import { useTranslation } from 'react-i18next';
import { Link, generatePath, useLocation, useParams } from 'react-router-dom';
import { SendingType } from '~/constants/sending-type';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { EmptyChartIcon } from '../icons/empty-chart-icon';
import { PieChartProps } from './interfaces';
import {
  ChartActionsContainer,
  ChartContainer,
  ChartCount,
  ChartTitle,
  EmptyChartContainer,
  EmptyChartText,
} from './styles';

export const PieChart = ({
  title,
  data,
  isLoading,
  type,
  shouldShowActions = true,
  height,
}: PieChartProps) => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const statusList = searchParams.get('statusList')?.split(',') || null;
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { fullTable } = routes.modules.children.dashboard.children.sendingList.children;
  const { pieChart: pieChartLocaleKeys } = localeKeys.dashboard.sendingList;

  const queryString = createQueryString({ startDate, endDate, type });
  const detailsPath = generatePath(fullTable.fullPath, { workspaceId }) + queryString;

  const analytics = [
    {
      key: SendingStatus.CONFIRMED,
      name: t(pieChartLocaleKeys.confirmedLegend),
      y: data?.confirmed,
    },
    { key: SendingStatus.CANCELED, name: t(pieChartLocaleKeys.canceledLegend), y: data?.canceled },
    {
      key: SendingStatus.SENDED,
      name: t(pieChartLocaleKeys.sentLegend),
      y: type !== SendingType.confirmation ? data?.notAnswered : undefined,
    },
    {
      key: SendingStatus.INVALID,
      name: t(pieChartLocaleKeys.invalidNumberLegend),
      y: data?.invalidNumber,
    },
    {
      key: SendingStatus.NOT_ANSWERED,
      name: t(pieChartLocaleKeys.notAnswered),
      y: type === SendingType.confirmation ? data?.notAnswered : undefined,
    },
    {
      key: SendingStatus.RESCHEDULE,
      name: t(pieChartLocaleKeys.reshceduleLegend),
      y: data?.reschedule,
    },
    { key: SendingStatus.OPEN_CVS, name: t(pieChartLocaleKeys.openCvsLegend), y: data?.open_cvs },
    {
      key: SendingStatus.NO_RECIPIENT,
      name: t(pieChartLocaleKeys.noRecipient),
      y: data?.no_recipient,
    },
    {
      key: SendingStatus.INVALID_RECIPIENT,
      name: t(pieChartLocaleKeys.invalidRecipíent),
      y: data?.invalid_recipient,
    },
  ]
    .filter((analytic) => !statusList || statusList.includes(analytic.key))
    .filter((analytic) => analytic.y && analytic.y > 0);

  const colorsMap = [
    {
      key: SendingStatus.CONFIRMED,
      color: '#2caffe',
    },
    {
      key: SendingStatus.CANCELED,
      color: '#544fc5',
    },
    {
      key: SendingStatus.SENDED,
      color: '#00e272',
    },
    {
      key: SendingStatus.INVALID,
      color: '#fe6a35',
    },
    {
      key: SendingStatus.NOT_ANSWERED,
      color: '#6b8abc',
    },
    {
      key: SendingStatus.RESCHEDULE,
      color: '#ffdd00',
    },
    {
      key: SendingStatus.OPEN_CVS,
      color: '#a855f7',
    },
    {
      key: SendingStatus.NO_RECIPIENT,
      color: '#f7b155',
    },
    {
      key: SendingStatus.INVALID_RECIPIENT,
      color: '#ff0000',
    },
  ]
    .filter((colorMapItem) => analytics.some((analytic) => analytic.key === colorMapItem.key))
    .map((colorMapItem) => colorMapItem.color);

  const options: HighchartsReactProps = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      // spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      spacingTop: 0,
      height: height || 250,
    },
    tooltip: {
      formatter() {
        return `<b>${this.point.name}</b>: ${this.point.y} <br /> <b>${t(
          pieChartLocaleKeys.percentageText
        )}</b>: ${this.point.percentage.toFixed(2)}%`;
      },
    },
    legend: {
      itemWidth: 158,
      alignColumns: true,
      itemMarginBottom: 2,
    },
    plotOptions: {
      pie: {
        cursor: 'default',
        size: '100%',
        center: ['50%', '50%'],
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
      },
    },
    title: { text: '' },
    colors: colorsMap,
    series: [
      {
        name: 'Brands',
        colorByPoint: true,
        slicedOffset: 0,
        point: {
          events: {
            legendItemClick: () => {
              return false;
            },
          },
        },
        data: analytics,
      },
    ],
  };
  const totalFiltered = analytics.reduce((total, analytic) => total + (analytic.y || 0), 0);

  return (
    <Spin spinning={isLoading}>
      <ChartContainer shouldShowActions={shouldShowActions}>
        <Space direction='vertical'>
          <ChartTitle>{title}</ChartTitle>
          <ChartCount>{totalFiltered || 0}</ChartCount>
        </Space>
        <Divider style={{ marginTop: 12, marginBottom: 12 }} />
        {data && data.total! > 0 ? (
          <Space direction='vertical'>
            <HighchartsReact highcharts={Highcharts} options={options} />
            {shouldShowActions && (
              <ChartActionsContainer>
                <Link to={detailsPath}>
                  <Button>{t(pieChartLocaleKeys.seeMoreButton)}</Button>
                </Link>
              </ChartActionsContainer>
            )}
          </Space>
        ) : (
          <EmptyChartContainer align='middle' justify='center' gutter={[0, 64]}>
            <Col span={24}>
              <Flex justify='center'>
                <EmptyChartIcon />
              </Flex>
            </Col>
            <Col span={24}>
              <Flex justify='center'>
                <EmptyChartText>{t(pieChartLocaleKeys.emptyChartMessage)}</EmptyChartText>
              </Flex>
            </Col>
          </EmptyChartContainer>
        )}
      </ChartContainer>
    </Spin>
  );
};
