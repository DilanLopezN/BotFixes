/* eslint-disable react/no-this-in-sfc */
import { Col, Divider, Flex, Space, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact, { type HighchartsReactProps } from 'highcharts-react-official';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { EmptyChartIcon } from '../icons/empty-chart-icon';
import { CancelingReasonChartProps } from './interfaces';
import {
  ChartContainer,
  ChartCount,
  ChartTitle,
  EmptyChartContainer,
  EmptyChartText,
} from './styles';

export const CancelingReasonChart = ({ title, data, isLoading }: CancelingReasonChartProps) => {
  const { t } = useTranslation();
  const { pieChart: pieChartLocaleKeys } = localeKeys.dashboard.sendingList;

  const analytics = data?.map((analytic) => {
    return { name: analytic.reasonName, y: analytic.count };
  });

  const totalCount = data?.reduce((previousValue, currentCalue) => {
    return previousValue + currentCalue.count;
  }, 0);

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
      height: 250,
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

  return (
    <Spin spinning={isLoading}>
      <ChartContainer>
        <Space direction='vertical'>
          <ChartTitle>{title}</ChartTitle>
          <ChartCount>{totalCount || 0}</ChartCount>
        </Space>
        <Divider style={{ marginTop: 12, marginBottom: 12 }} />
        {totalCount && totalCount > 0 ? (
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
                <EmptyChartText>{t(pieChartLocaleKeys.emptyChartMessage)}</EmptyChartText>
              </Flex>
            </Col>
          </EmptyChartContainer>
        )}
      </ChartContainer>
    </Spin>
  );
};
