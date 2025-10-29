import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IntegrationEnvironment } from '~/constants/integration-environment';
import { IntegrationsType } from '~/constants/integrations-type';
import type { ApiError } from '~/interfaces/api-error';
import { getHealthIntegrationsByWorkspaceId } from '~/services/workspace/get-health-integrations-by-workspace-id';
import type { HealthIntegration } from '~/services/workspace/get-health-integrations-by-workspace-id/interfaces';
import { notifyError } from '~/utils/notify-error';

export const useSelectedIntegration = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<HealthIntegration>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!workspaceId) return;

      try {
        setIsLoading(true);
        setError(undefined);
        const healthIntegrationsList = await getHealthIntegrationsByWorkspaceId(workspaceId);
        const selectedIntegration = healthIntegrationsList.data.find(
          (integration) =>
            integration.environment === IntegrationEnvironment.production &&
            integration.type !== IntegrationsType.DOCTORALIA &&
            integration.type !== IntegrationsType.CM &&
            integration.type !== IntegrationsType.CUSTOM_IMPORT
        );
        setData(selectedIntegration);
      } catch (err) {
        setError(err as ApiError);
        notifyError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [workspaceId]);

  return { data, isLoading, error };
};
