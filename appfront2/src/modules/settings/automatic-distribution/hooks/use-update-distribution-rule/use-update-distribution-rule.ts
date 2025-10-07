import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import { updateDistributionRule as updateDistributionRuleService } from '~/services/conversation-automatc-distribution/update-distribution-rule';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { DistributionRuleData, DistributionRuleUpdateData } from '../../interfaces';

export const useUpdateDistributionRule = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<ApiError | null>(null);
  const { t } = useTranslation();
  const { updateError: updateErrorKey, updateSuccess } =
    localeKeys.settings.automaticDistribution.hooks;

  const updateDistributionRule = async (
    ruleId: string,
    payload: DistributionRuleUpdateData
  ): Promise<DistributionRuleData | null> => {
    if (!workspaceId) return null;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const response = await updateDistributionRuleService(workspaceId, ruleId, payload);
      notifySuccess({ message: t(updateSuccess), description: '' });
      return response;
    } catch (err) {
      const error = err as ApiError;
      setUpdateError(error);
      notifyError({ message: t(updateErrorKey) });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateDistributionRule,
    isUpdating,
    updateError,
  };
};
