import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import { getDistributionRuleById } from '~/services/conversation-automatc-distribution/get-distribution-rule';
import { notifyError } from '~/utils/notify-error';
import { DistributionRuleData } from '../../interfaces';

export const useFetchDistributionRule = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<DistributionRuleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { t } = useTranslation();
  const { fetchError } = localeKeys.settings.automaticDistribution.hooks;

  const fetchRule = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getDistributionRuleById(workspaceId);
      if (response) {
        setData(response);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err as ApiError);
      notifyError({ message: t(fetchError) });
    } finally {
      setIsLoading(false);
    }
  }, [fetchError, t, workspaceId]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule, workspaceId]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRule,
  };
};
