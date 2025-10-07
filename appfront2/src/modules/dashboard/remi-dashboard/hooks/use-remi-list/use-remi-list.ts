import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { fetchAllRemiSettings } from '~/services/workspace/fetch-all-remi-settings';
import { notifyError } from '~/utils/notify-error';

export const useRemiList = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [remiList, setRemiList] = useState<RemiConfigData[]>([]);
  const [isLoadingRemiList, setIsLoadingRemiList] = useState(true);
  const [remiListError, setRemiListError] = useState<ApiError | null>(null);

  const fetchRemiList = useCallback(async () => {
    setIsLoadingRemiList(true);
    setRemiListError(null);
    try {
      const response = await fetchAllRemiSettings(workspaceId);
      setRemiList(response);
      setIsLoadingRemiList(false);
      return true;
    } catch (err) {
      setRemiListError(err as ApiError);
      setIsLoadingRemiList(false);
      notifyError('Erro ao carregar lista de REMIs');
      return false;
    }
  }, [workspaceId]);

  return {
    remiList,
    isLoadingRemiList,
    remiListError,
    fetchRemiList,
  };
};
