import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import {
  getSendingListByWorkspaceId,
  type SendingList,
} from '~/services/workspace/get-sending-list-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { SendingListQueryString } from '../../interfaces';
import { useFilters } from '../use-filters';

export const useSendingList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const filters = useFilters();
  const [sendingList, setSendingList] = useState<SendingList>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const { startDate, endDate } = queryStringAsObj;
  const currentPage = Number(queryStringAsObj.currentPage || 1);
  const pageSize = Number(queryStringAsObj.pageSize || 10);

  const queryString = useMemo(() => {
    if (!pageSize || !currentPage) {
      return '';
    }

    const limitedPageSize = Math.min(pageSize, 100);

    const qString = createQueryString({
      limit: limitedPageSize,
      skip: Math.max(currentPage - 1, 0) * limitedPageSize,
    });
    return qString;
  }, [currentPage, pageSize]);

  const fetchData = useCallback(async () => {
    if (!workspaceId || !startDate || !endDate) return;

    try {
      setError(undefined);
      setIsLoading(true);

      const response = await getSendingListByWorkspaceId(filters, queryString);

      setSendingList(response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, startDate, endDate, filters, queryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sendingList, isLoading, error, fetchData };
};
