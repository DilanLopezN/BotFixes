import { useTranslation } from 'react-i18next';
import { SendingType } from '~/constants/sending-type';
import { localeKeys } from '~/i18n';
import { CancelingReasonChart } from '../../components/canceling-reason-chart';
import { PieChart } from '../../components/pie-chart';
import { useCancelingReasonMetrics } from '../../hooks/use-canceling-reason-metrics';
import type { ConfirmationChartsProps } from './interfaces';

export const ConfirmationCharts = ({
  scheduleAnalytics,
  isLoadingSchedules,
}: ConfirmationChartsProps) => {
  const { cancelingReasonMetrics, isLoadingCancelingReasonMetrics } = useCancelingReasonMetrics();
  const { t } = useTranslation();
  const { confirmationCharts: confirmationChartsLocaleKeys } = localeKeys.dashboard.sendingList;

  return (
    <>
      <PieChart
        title={t(confirmationChartsLocaleKeys.titleConfirmations)}
        data={scheduleAnalytics?.confirmation}
        isLoading={isLoadingSchedules}
        type={SendingType.confirmation}
        shouldShowActions={false}
        height={300}
      />
      <CancelingReasonChart
        title={t(confirmationChartsLocaleKeys.titleCancelingReason)}
        data={cancelingReasonMetrics}
        isLoading={isLoadingCancelingReasonMetrics}
      />
    </>
  );
};
