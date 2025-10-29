import { useCallback, useState } from 'react';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import type { ApiError } from '~/interfaces/api-error';
import { type PaginatedModel } from '~/interfaces/paginated-model';
import { type HealthEntity, getHealthEntities } from '~/services/workspace/get-health-entities';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';
import type { UseHealthEntitiesProps } from './interfaces';

export const useHealthEntities = ({
  searchInputValue,
  entityType,
  integrationId,
  currentPage,
}: UseHealthEntitiesProps) => {
  const selectedWorkspace = useSelectedWorkspace();
  const [data, setData] = useState<PaginatedModel<HealthEntity>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const fetchConfirmationEntity = useCallback(async () => {
    if (!integrationId) return;

    try {
      setIsLoading(true);
      setError(undefined);

      const queryString = createQueryString({
        limit: 6,
        skip: Math.max(currentPage - 1, 0) * 6,
        entityType,
        search: searchInputValue,
      });

      const healthEntities = await getHealthEntities({
        workspaceId: selectedWorkspace._id,
        integrationId,
        queryString,
      });
      setData(healthEntities);
    } catch (err) {
      setError(err as ApiError);
      notifyError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, entityType, integrationId, searchInputValue, selectedWorkspace._id]);

  return { data, isLoading, error, fetchConfirmationEntity };
};
