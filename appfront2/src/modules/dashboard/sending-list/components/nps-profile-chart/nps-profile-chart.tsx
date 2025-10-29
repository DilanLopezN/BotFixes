/* eslint-disable react/no-this-in-sfc */
import { Col, Divider, Flex, Space, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact, { type HighchartsReactProps } from 'highcharts-react-official';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { EmptyChartIcon } from '../icons/empty-chart-icon';
import type { PieChartProps } from './interfaces';
import {
  ChartContainer,
  ChartCount,
  ChartTitle,
  EmptyChartContainer,
  EmptyChartText,
} from './styles';

const { npsProfileChart: npsProfileChartLocaleKeys } = localeKeys.dashboard.sendingList;

export const NpsProfileChart = ({ npsProfile, height, isLoading = false }: PieChartProps) => {
  const { t } = useTranslation();
  const analytics = [
    {
      key: '1',
      name: t(npsProfileChartLocaleKeys.nameDetractor),
      y: npsProfile?.detractorCount || 0,
    },
    {
      key: '2',
      name: t(npsProfileChartLocaleKeys.namePromoter),
      y: npsProfile?.promoterCount || 0,
    },
    {
      key: '3',
      name: t(npsProfileChartLocaleKeys.namePassive),
      y: npsProfile?.passiveCount || 0,
    },
  ];

  const options: HighchartsReactProps = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      spacingLeft: 0,
      spacingRight: 0,
      spacingTop: 0,
      height: height || 250,
    },
    tooltip: {
      formatter() {
        return `<b>${this.point.name}</b>: ${this.point.y} <br /> <b>${t(
          npsProfileChartLocaleKeys.percentage
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
      <ChartContainer>
        <Space direction='vertical'>
          <ChartTitle>{t(npsProfileChartLocaleKeys.chartTitle)}</ChartTitle>
          <ChartCount>{totalFiltered || 0}</ChartCount>
        </Space>
        <Divider style={{ marginTop: 12, marginBottom: 12 }} />
        {totalFiltered > 0 ? (
          <Space direction='vertical'>
            <HighchartsReact highcharts={Highcharts} options={options} />
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
                <EmptyChartText>{t(npsProfileChartLocaleKeys.emptyChartText)}</EmptyChartText>
              </Flex>
            </Col>
          </EmptyChartContainer>
        )}
      </ChartContainer>
    </Spin>
  );
};
