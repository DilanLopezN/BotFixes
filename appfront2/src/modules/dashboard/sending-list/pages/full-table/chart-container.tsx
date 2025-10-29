import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SendingType } from '~/constants/sending-type';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { PieChart } from '../../components/pie-chart';
import { useScheduleAnalytics } from '../../hooks/use-schedule-analytics';
import { SendingListQueryString } from '../../interfaces';
import { ConfirmationCharts } from './confirmation-charts';
import { NpsScoreCharts } from './nps-score-charts';

export const ChartContainer = () => {
  const { t } = useTranslation();
  const { chartContainer: chartContainerLocaleKeys } = localeKeys.dashboard.sendingList;
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const { scheduleAnalytics, isLoading: isLoadindScheduleAnalytics } = useScheduleAnalytics();

  const { type } = queryStringAsObj;

  const allAnalytics = useMemo(() => {
    return scheduleAnalytics
      ? Object.values(scheduleAnalytics).reduce(
          (previousValue, currentValue) => {
            return {
              canceled: previousValue.canceled + (currentValue.canceled || 0),
              confirmed: previousValue.confirmed + (currentValue.confirmed || 0),
              invalidNumber: previousValue.invalidNumber + (currentValue.invalidNumber || 0),
              invalid_recipient:
                previousValue.invalid_recipient + (currentValue.invalid_recipient || 0),
              recipient_type: previousValue.recipient_type + (currentValue.recipient_type || 0),
              no_recipient: previousValue.no_recipient + (currentValue.no_recipient || 0),
              notAnswered: previousValue.notAnswered + (currentValue.notAnswered || 0),
              open_cvs: previousValue.open_cvs + (currentValue.open_cvs || 0),
              reschedule: previousValue.reschedule + (currentValue.reschedule || 0),
              individual_cancel:
                previousValue.individual_cancel + (currentValue.individual_cancel || 0),
              start_reschedule_recover:
                previousValue.start_reschedule_recover +
                (currentValue.start_reschedule_recover || 0),
              cancel_reschedule_recover:
                previousValue.cancel_reschedule_recover +
                (currentValue.cancel_reschedule_recover || 0),
              confirm_reschedule_recover:
                previousValue.confirm_reschedule_recover +
                (currentValue.confirm_reschedule_recover || 0),
              confirm_reschedule:
                previousValue.confirm_reschedule + (currentValue.confirm_reschedule || 0),
              document_uploaded:
                previousValue.document_uploaded + (currentValue.document_uploaded || 0),
              total: previousValue.total + (currentValue.total || 0),
            };
          },
          {
            canceled: 0,
            confirmed: 0,
            invalidNumber: 0,
            invalid_recipient: 0,
            recipient_type: 0,
            no_recipient: 0,
            notAnswered: 0,
            open_cvs: 0,
            reschedule: 0,
            individual_cancel: 0,
            start_reschedule_recover: 0,
            cancel_reschedule_recover: 0,
            confirm_reschedule_recover: 0,
            confirm_reschedule: 0,
            document_uploaded: 0,
            total: 0,
          }
        )
      : undefined;
  }, [scheduleAnalytics]);

  if (type === SendingType.confirmation) {
    return (
      <ConfirmationCharts
        scheduleAnalytics={scheduleAnalytics}
        isLoadingSchedules={isLoadindScheduleAnalytics}
      />
    );
  }

  if (type === SendingType.medical_report) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleMedicalReport)}
        data={scheduleAnalytics?.medical_report}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.medical_report}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  if (type === SendingType.nps) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleNps)}
        data={scheduleAnalytics?.nps}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.nps}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  if (type === SendingType.nps_score) {
    return (
      <NpsScoreCharts
        scheduleAnalytics={scheduleAnalytics}
        isLoadingSchedules={isLoadindScheduleAnalytics}
      />
    );
  }

  if (type === SendingType.recover_lost_schedule) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleRecoverLostSchedule)}
        data={scheduleAnalytics?.recover_lost_schedule}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.recover_lost_schedule}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  if (type === SendingType.reminder) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleReminder)}
        data={scheduleAnalytics?.reminder}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.reminder}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  if (type === SendingType.schedule_notification) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleScheduleNotification)}
        data={scheduleAnalytics?.schedule_notification}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.schedule_notification}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  if (type === SendingType.documents_request) {
    return (
      <PieChart
        title={t(chartContainerLocaleKeys.titleDocumentsRequest)}
        data={scheduleAnalytics?.documents_request}
        isLoading={isLoadindScheduleAnalytics}
        type={SendingType.documents_request}
        shouldShowActions={false}
        height={300}
      />
    );
  }

  return (
    <PieChart
      title={t(chartContainerLocaleKeys.titleAllAppointments)}
      data={allAnalytics}
      isLoading={isLoadindScheduleAnalytics}
      shouldShowActions={false}
      height={300}
    />
  );
};
