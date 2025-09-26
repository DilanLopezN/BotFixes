import { Col, DatePicker, Flex, Row, Space } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '~/components/page-template';
import { SendingType } from '~/constants/sending-type';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { PieChart } from '../../components/pie-chart';
import { useScheduleAnalytics } from '../../hooks/use-schedule-analytics';
import type { SendingListQueryString } from '../../interfaces';
import { allowedQueries } from './constants';
import { ChartContainerTitle } from './styles';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { queryStringAsObj, updateQueryString } = useQueryString<SendingListQueryString>({
    allowedQueries,
  });
  const { scheduleAnalytics, isLoading: isLoadindScheduleAnalytics } = useScheduleAnalytics();

  const { dashboard: dashboardLocaleKeys } = localeKeys.dashboard.sendingList;

  const handleChangeDateRangePicker: RangePickerProps['onChange'] = (dates, _datesAsString) => {
    const newStartDate = dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '';
    const newEndDate = dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '';
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  };

  useEffect(() => {
    if (
      queryStringAsObj.startDate &&
      queryStringAsObj.endDate &&
      dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD', true).isValid() &&
      dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD', true).isValid()
    ) {
      return;
    }
    const newStartDate = dayjs().subtract(3, 'days').format('YYYY-MM-DD');
    const newEndDate = dayjs().add(3, 'days').format('YYYY-MM-DD');
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  }, [queryStringAsObj.endDate, queryStringAsObj.startDate, updateQueryString]);

  return (
    <PageTemplate title={t(dashboardLocaleKeys.pageTitle)}>
      <Row gutter={[16, 16]} style={{ paddingBottom: 24 }}>
        <Col span={24}>
          <Flex justify='space-between' align='center'>
            <Space align='center' size='middle'>
              <ChartContainerTitle>{t(dashboardLocaleKeys.chartListTitle)}</ChartContainerTitle>
              <DatePicker.RangePicker
                allowClear={false}
                format='DD/MM/YYYY'
                onChange={handleChangeDateRangePicker}
                value={[dayjs(queryStringAsObj.startDate), dayjs(queryStringAsObj.endDate)]}
                placeholder={[
                  t(dashboardLocaleKeys.rangeDatePickerStartDatePlaceholder),
                  t(dashboardLocaleKeys.rangeDatePickerEndDatePlaceholder),
                ]}
              />
            </Space>
          </Flex>
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.confirmationsChartTitle)}
            data={scheduleAnalytics?.confirmation}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.confirmation}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.npsChartTitle)}
            data={scheduleAnalytics?.nps}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.nps}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.remindersChartTitle)}
            data={scheduleAnalytics?.reminder}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.reminder}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.medicalReportChartTitle)}
            data={scheduleAnalytics?.medical_report}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.medical_report}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.scheduleNotificationChartTitle)}
            data={scheduleAnalytics?.schedule_notification}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.schedule_notification}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.npsScoreChartTitle)}
            data={scheduleAnalytics?.nps_score}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.nps_score}
          />
        </Col>
        <Col span={6}>
          <PieChart
            title={t(dashboardLocaleKeys.recoverLostScheduleChartTitle)}
            data={scheduleAnalytics?.recover_lost_schedule}
            isLoading={isLoadindScheduleAnalytics}
            type={SendingType.recover_lost_schedule}
          />
        </Col>
      </Row>
    </PageTemplate>
  );
};
