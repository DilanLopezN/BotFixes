import { useCallback, useState } from 'react';
import type { ApiError } from '~/interfaces/api-error';
import {
  getAppointmentTableData,
  type GetAppointmentTableDataResponse,
} from '~/services/workspace/get-appointment-table-data';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';

export const useAppointmentTableData = (page: number, pageSize: number) => {
  const [appointmentTableData, setAppointmentTableData] =
    useState<GetAppointmentTableDataResponse>();
  const [isFetchingAppointmentTableData, setIsFetchingAppointmentTableData] = useState(true);
  const [fetchAppointmentTableDataError, setFetchAppointmentTableDataError] = useState<ApiError>();
  const filters = useFilters();

  const fetchAppointmentTableData = useCallback(async () => {
    try {
      setFetchAppointmentTableDataError(undefined);
      setIsFetchingAppointmentTableData(true);
      // Buscar 21 itens para detectar se há próxima página
      const response = await getAppointmentTableData({
        data: filters,
        limit: pageSize + 1,
        skip: Math.max(page - 1, 0) * pageSize,
      });

      setAppointmentTableData(response);
      setIsFetchingAppointmentTableData(false);
    } catch (error) {
      notifyError('Erro ao carregar a tabela');
      setFetchAppointmentTableDataError(error as ApiError);
      setIsFetchingAppointmentTableData(false);
    }
  }, [filters, page, pageSize]);

  return {
    fetchAppointmentTableData,
    appointmentTableData,
    isFetchingAppointmentTableData,
    fetchAppointmentTableDataError,
  };
};
