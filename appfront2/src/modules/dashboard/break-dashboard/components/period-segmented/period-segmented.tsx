import { Segmented, type SegmentedProps } from 'antd';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useQueryString } from '~/hooks/use-query-string';
import { BreakDashboardQueryString } from '../../interfaces';
import { SegmentedWrapper } from './styles';

export const PeriodSegmented = () => {
  const { subTabId } = useParams();
  const { queryStringAsObj, updateQueryString } = useQueryString<BreakDashboardQueryString>();

  const isRealTimeActive = queryStringAsObj.isRealtime === 'true';
  const isExcessiveBreakTab = subTabId === 'excessive-break';

  const options: SegmentedProps['options'] = [
    { value: AnalyticsInterval.Day, label: 'Dia' },
    { value: AnalyticsInterval.Month, label: 'Mês' },
  ];

  const handleChangeRadio: SegmentedProps['onChange'] = (value) => {
    updateQueryString({ groupDateBy: value });
  };

  useEffect(() => {
    if (queryStringAsObj.groupDateBy === undefined) {
      updateQueryString({ groupDateBy: AnalyticsInterval.Day });
    }
  }, [queryStringAsObj.groupDateBy, updateQueryString]);

  return (
    <SegmentedWrapper>
      <Segmented
        options={options}
        value={queryStringAsObj.groupDateBy}
        onChange={handleChangeRadio}
        disabled={isRealTimeActive || isExcessiveBreakTab}
      />
    </SegmentedWrapper>
  );
};
