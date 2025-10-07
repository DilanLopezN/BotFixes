import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { FlowCategory } from '~/interfaces/flow-libraries';
import { listFlowCategories } from '~/services/channels/get-flow-categories';
import { notifyError } from '~/utils/notify-error';

export const useFlowCategories = () => {
  const [flowCategories, setFlowCategories] = useState<FlowCategory[]>([]);
  const [isFetchingFlowCategories, setIsFetchingFlowCategories] = useState(true);
  const [fetchFlowCategoriesError, setFetchFlowCategoriesError] = useState<ApiError>();

  const { t } = useTranslation();

  const fetchFlowCategories = useCallback(async () => {
    const flowCategoriesLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.flowCategories;

    try {
      setFetchFlowCategoriesError(undefined);
      setIsFetchingFlowCategories(true);
      const response = await listFlowCategories();
      setFlowCategories(response);
      setIsFetchingFlowCategories(false);
      return true;
    } catch (error) {
      notifyError(t(flowCategoriesLocaleKeys.errorMessage));
      setFetchFlowCategoriesError(error as ApiError);
      setIsFetchingFlowCategories(false);
      return false;
    }
  }, [t]);

  useEffect(() => {
    fetchFlowCategories();
  }, [fetchFlowCategories]);

  return {
    flowCategories,
    isFetchingFlowCategories,
    fetchFlowCategoriesError,
    fetchFlowCategories,
  };
};
