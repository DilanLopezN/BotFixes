import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { getRemiReports, type GetRemiReportsResponse } from '~/services/workspace/get-remi-reports';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';

export const useRemiReports = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [remiReports, setRemiReports] = useState<GetRemiReportsResponse>();
  const [isLoadingRemiReports, setIsLoadingRemiReports] = useState(true);
  const [remiReportsError, setRemiReportsError] = useState<ApiError | null>(null);

  const fetchRemiReports = useCallback(async () => {
    setIsLoadingRemiReports(true);
    setRemiReportsError(null);
    try {
      const response = await getRemiReports(workspaceId, filters);
      setRemiReports(response);
      setIsLoadingRemiReports(false);
      return true;
    } catch (err) {
      setRemiReportsError(err as ApiError);
      setIsLoadingRemiReports(false);
      notifyError('Erro ao carregar relatórios do REMI');
      return false;
    }
  }, [filters, workspaceId]);

  return {
    remiReports,
    isLoadingRemiReports,
    remiReportsError,
    fetchRemiReports,
  };
};
