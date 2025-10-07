import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import { createDistributionRule as createDistributionRuleService } from '~/services/conversation-automatc-distribution/create-distribution-rule';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { DistributionRuleCreateData, DistributionRuleData } from '../../interfaces';

export const useCreateDistributionRule = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | null>(null);
  const { t } = useTranslation();
  const { createError: createErrorKey, createSuccess } =
    localeKeys.settings.automaticDistribution.hooks;

  const createDistributionRule = async (
    config: DistributionRuleCreateData
  ): Promise<DistributionRuleData | null> => {
    if (!workspaceId) return null;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createDistributionRuleService(workspaceId, config);
      notifySuccess({ message: t(createSuccess), description: '' });

      return response;
    } catch (err) {
      const error = err as ApiError;
      setCreateError(error);
      notifyError({ message: t(createErrorKey) });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createDistributionRule,
    isCreating,
    createError,
  };
};
