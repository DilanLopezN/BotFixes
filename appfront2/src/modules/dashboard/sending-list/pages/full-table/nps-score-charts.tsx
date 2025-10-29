import { useTranslation } from 'react-i18next';
import { SendingType } from '~/constants/sending-type';
import { localeKeys } from '~/i18n';
import { NpsProfileChart } from '../../components/nps-profile-chart';
import { NpsScoreChart } from '../../components/nps-score-chart';
import { PieChart } from '../../components/pie-chart';
import { useNpsAnalytics } from '../../hooks/use-nps-analytics';
import type { ConfirmationChartsProps } from './interfaces';

export const NpsScoreCharts = ({
  scheduleAnalytics,
  isLoadingSchedules,
}: ConfirmationChartsProps) => {
  const { npsAnalytics, isLoadingNpsAnalytics } = useNpsAnalytics();

  const { t } = useTranslation();
  const { npsScoreCharts: npsScoreChartsLocaleKeys } = localeKeys.dashboard.sendingList;

  const npsProfile = npsAnalytics?.reduce(
    (previousValue, currentValue) => {
      const score = Number(currentValue.nps_score);

      if (score >= 9) {
        return {
          ...previousValue,
          promoterCount: previousValue.promoterCount + currentValue.count,
          total: previousValue.total + currentValue.count,
        };
      }

      if (score >= 7) {
        return {
          ...previousValue,
          passiveCount: previousValue.passiveCount + currentValue.count,
          total: previousValue.total + currentValue.count,
        };
      }

      return {
        ...previousValue,
        detractorCount: previousValue.detractorCount + currentValue.count,
        total: previousValue.total + currentValue.count,
      };
    },
    {
      promoterCount: 0,
      passiveCount: 0,
      detractorCount: 0,
      total: 0,
    }
  );

  const npsScore = npsProfile
    ? ((npsProfile.promoterCount - npsProfile.detractorCount) * 100) / npsProfile.total || 0
    : undefined;

  return (
    <>
      <NpsScoreChart npsScore={npsScore} isLoading={isLoadingNpsAnalytics} />
      <NpsProfileChart npsProfile={npsProfile} isLoading={isLoadingNpsAnalytics} />
      <PieChart
        title={t(npsScoreChartsLocaleKeys.titleNpsChart)}
        data={scheduleAnalytics?.nps_score}
        isLoading={isLoadingSchedules}
        type={SendingType.nps_score}
        shouldShowActions={false}
        height={300}
      />
    </>
  );
};
