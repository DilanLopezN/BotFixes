/* eslint-disable react/no-this-in-sfc */
import { Spin } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Highcharts from 'highcharts';
import HighchartsReact, { type HighchartsReactProps } from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import { useMemo } from 'react';
import { formatDurationHms } from '~/utils/format-duration-hms';
import { MetricLineChartProps } from './interfaces';
import { ChartContainer } from './styles';

NoDataToDisplay(Highcharts);
dayjs.extend(utc);

export const MetricLineChart = ({
  data = [],
  title,
  groupBy,
  isLoading,
  legend,
}: MetricLineChartProps) => {
  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, cur) => {
      const baseDate = dayjs.utc(cur.date);

      const key =
        groupBy === 'day'
          ? baseDate.format('YYYY-MM-DD')
          : baseDate.startOf('month').format('YYYY-MM');

      acc[key] = (acc[key] || 0) + cur.agg_result;
      return acc;
    }, {} as any);

    const result = Object.entries(grouped)
      .map(([date, totalAggResult]) => {
        const label =
          groupBy === 'day' ? dayjs.utc(date).format('DD/MM') : dayjs.utc(date).format('MM/YYYY');

        return {
          date: label,
          agg_result: totalAggResult,
          _sortKey: date,
        };
      })
      .sort((a, b) => dayjs(a._sortKey).unix() - dayjs(b._sortKey).unix());

    return result;
  }, [data, groupBy]);

  const categories = groupedData.map((p) => p.date);
  const values = groupedData.map((p) => p.agg_result);

  const options: HighchartsReactProps = {
    chart: {
      type: 'line',
      height: 488,
    },
    tooltip: {
      pointFormatter() {
        const totalSeconds = this.y;
        const formattedValue = formatDurationHms(totalSeconds);
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formattedValue}</b><br/>`;
      },
      shared: false,
    },
    title: {
      text: title,
    },
    xAxis: {
      categories,
      title: {
        text: null,
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: null,
      },
    },
    series: [
      {
        name: legend,
        data: values,
        color: '#1677ff',
      },
    ],
    lang: {
      noData: 'Não há dados',
    },
    legend: {
      enabled: false,
    },
  };

  return (
    <Spin spinning={isLoading}>
      <ChartContainer>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </ChartContainer>
    </Spin>
  );
};
