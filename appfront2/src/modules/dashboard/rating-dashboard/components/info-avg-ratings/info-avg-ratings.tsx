import { Card, Divider, Flex, Progress, Rate, Typography } from 'antd';
import { isNaN } from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { InfoAvgRatingsProps } from './interfaces';

export const InfoAvgRatings = ({ loading, infoAvgRating }: InfoAvgRatingsProps) => {
  const { t } = useTranslation();
  const locale = localeKeys.dashboard.ratingDashboard.components.infoAvgRatings;

  const { avg, count, values } = infoAvgRating || {
    avg: 0,
    count: 0,
    values: { note1: 0, note2: 0, note3: 0, note4: 0, note5: 0 },
  };

  const rateValue = useMemo(() => {
    if (typeof avg === 'number' && !isNaN(avg)) {
      return Math.round(avg / 0.5) * 0.5;
    }
    return 0;
  }, [avg]);

  const breakdownData = useMemo(
    () => [
      { stars: 5, count: values.note5 },
      { stars: 4, count: values.note4 },
      { stars: 3, count: values.note3 },
      { stars: 2, count: values.note2 },
      { stars: 1, count: values.note1 },
    ],
    [values]
  );

  return (
    <Card loading={loading} styles={{ body: { padding: '16px' } }}>
      <Flex vertical align='center'>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t(locale.avgRatingTitle)}
        </Typography.Title>
        <Typography.Title level={1} style={{ margin: '8px 0', fontSize: '3rem' }}>
          {avg.toFixed(1)}
        </Typography.Title>
        <Rate disabled allowHalf value={rateValue} />
        <Typography.Text type='secondary' style={{ marginTop: 8 }}>
          {t(locale.totalRatings, { count })}
        </Typography.Text>

        <Divider style={{ margin: '16px 0' }} />

        <Flex vertical gap='small' style={{ width: '100%' }}>
          {breakdownData.map(({ stars, count: valueCount }) => {
            const percentage = count > 0 ? Math.round((valueCount / count) * 100) : 0;

            return (
              <Flex key={stars} align='center' gap='small' style={{ width: '100%' }}>
                <Typography.Text style={{ minWidth: '35px' }}>{stars} ★</Typography.Text>
                <Progress percent={percentage} showInfo={false} size='small' style={{ flex: 1 }} />
                <Typography.Text type='secondary' style={{ minWidth: '30px', textAlign: 'right' }}>
                  {valueCount}
                </Typography.Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
};
