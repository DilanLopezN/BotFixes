import { Divider, Space, Spin, Col, Flex } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsSolidGauge from 'highcharts/modules/solid-gauge';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { EmptyChartIcon } from '../icons/empty-chart-icon';
import type { NpsScoreChartProps } from './interfaces';
import {
  ChartContainer,
  ChartTitle,
  LegendColor,
  LegendList,
  LegendText,
  LegentContainer,
  EmptyChartText,
  EmptyChartContainer,
} from './styles';

highchartsMore(Highcharts);
HighchartsSolidGauge(Highcharts);

const { npsScoreChart: npsScoreChartLocaleKeys } = localeKeys.dashboard.sendingList;

export const NpsScoreChart = ({ npsScore, isLoading }: NpsScoreChartProps) => {
  const { t } = useTranslation();

  const score = npsScore ? Number(npsScore.toFixed(2)) : undefined;

  const options = {
    chart: {
      type: 'gauge',
      plotBackgroundColor: null,
      plotBackgroundImage: null,
      plotBorderWidth: 0,
      plotShadow: false,
      height: '100%',
      spacing: [20, 20, 0, 20],
    },
    title: {
      text: null,
    },
    pane: {
      startAngle: -130,
      endAngle: 130,
      background: [
        {
          borderWidth: 0,
          outerRadius: '100%',
          innerRadius: '70%',
          shape: 'arc',
          backgroundColor: 'transparent',
        },
      ],
    },
    yAxis: {
      min: -100,
      max: 100,
      tickPositions: [-100, 0, 50, 75, 100],
      minorTickInterval: null,
      labels: {
        distance: 20,
        style: {
          fontSize: '14px',
        },
      },
      plotBands: [
        { from: -100, to: -1, color: '#bd0000', thickness: '10%', borderWidth: 0 },
        { from: 0, to: 49, color: '#FFD700', thickness: '10%', borderWidth: 0 },
        { from: 50, to: 74, color: '#9ACD32', thickness: '10%', borderWidth: 0 },
        { from: 75, to: 100, color: '#008000', thickness: '10%', borderWidth: 0 },
      ],
    },
    series: [
      {
        name: 'NPS',
        data: [score],
        tooltip: {
          style: {
            fontSize: '30px',
          },
        },
        dial: {
          backgroundColor: 'black',
          baseWidth: 4,
          baseLength: '15%',
          rearLength: '0%',
        },
        pivot: {
          backgroundColor: 'black',
          radius: 4,
        },
        dataLabels: {
          enabled: true,
          format: '{y}',
          borderWidth: 0,
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            borderWidth: 0,
          },
        },
      },
    ],
  };

  return (
    <Spin spinning={isLoading}>
      <ChartContainer>
        <ChartTitle>{t(npsScoreChartLocaleKeys.chartTitle)}</ChartTitle>
        <Divider style={{ marginTop: 12, marginBottom: 12 }} />

        {score ? (
          <Space direction='vertical'>
            <HighchartsReact highcharts={Highcharts} options={options} />
            <LegendList>
              <LegentContainer>
                <LegendColor color='#bd0000' />
                <LegendText>{t(npsScoreChartLocaleKeys.legendTextBad)}</LegendText>
              </LegentContainer>
              <LegentContainer>
                <LegendColor color='#FFD700' />
                <LegendText>{t(npsScoreChartLocaleKeys.legendTextReasonable)}</LegendText>
              </LegentContainer>
              <LegentContainer>
                <LegendColor color='#9ACD32' />
                <LegendText>{t(npsScoreChartLocaleKeys.legendTextVeryGood)}</LegendText>
              </LegentContainer>
              <LegentContainer>
                <LegendColor color='#008000' />
                <LegendText>{t(npsScoreChartLocaleKeys.legendTextExcellent)}</LegendText>
              </LegentContainer>
            </LegendList>
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
                <EmptyChartText>{t(npsScoreChartLocaleKeys.emptyChartText)}</EmptyChartText>
              </Flex>
            </Col>
          </EmptyChartContainer>
        )}
      </ChartContainer>
    </Spin>
  );
};
