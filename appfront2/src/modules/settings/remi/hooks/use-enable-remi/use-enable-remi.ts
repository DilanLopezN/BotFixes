import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import { updateWorkspaceById } from '~/services/workspace/update-workspace-by-id';
import { notifyError } from '~/utils/notify-error';

export const useEnableRemi = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const currentWorkspace = useSelectedWorkspace();
  const { refetch, isRefetching } = useWorkspaceList();
  const [isActivatingRemi, setIsActivatingRemi] = useState(false);
  const [activatingRemiError, setActivatingRemiError] = useState<ApiError>();

  const { t } = useTranslation();

  const useEnableRemiLocaleKeys = localeKeys.settings.remi.hooks.useEnableRemi;

  const activateRemi = useCallback(
    async (enableRemi: boolean) => {
      if (isActivatingRemi) return;

      try {
        setActivatingRemiError(undefined);
        setIsActivatingRemi(true);
        await updateWorkspaceById({
          ...currentWorkspace,
          _id: workspaceId,
          userFeatureFlag: {
            ...currentWorkspace.userFeatureFlag,
            enableRemi,
          },
        });
        refetch();
        setIsActivatingRemi(false);
        return true;
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response) {
            notifyError(t(useEnableRemiLocaleKeys.notifyErrorRemi));
          } else {
            notifyError(t(useEnableRemiLocaleKeys.createOutcomeError));
          }
          setActivatingRemiError(error as ApiError);
        }

        setIsActivatingRemi(false);
        return false;
      }
    },
    [
      currentWorkspace,
      isActivatingRemi,
      refetch,
      t,
      useEnableRemiLocaleKeys.createOutcomeError,
      useEnableRemiLocaleKeys.notifyErrorRemi,
      workspaceId,
    ]
  );

  return {
    isActivatingRemi: isActivatingRemi || isRefetching,
    activatingRemiError,
    activateRemi,
  };
};
