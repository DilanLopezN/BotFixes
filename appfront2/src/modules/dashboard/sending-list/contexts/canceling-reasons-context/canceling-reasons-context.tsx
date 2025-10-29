import { createContext, useMemo } from 'react';
import { useCancelingReasons } from '../../hooks/use-canceling-reasons';
import type { CancelingReasonContextProps, CancelingReasonContextValues } from './interfaces';

export const CancelingReasonContext = createContext<CancelingReasonContextValues>({
  cancelingReasons: [],
  isLoadingCancelingReasons: true,
  cancelingReasonsError: undefined,
  fetchCancelingReasons: () => {},
});

export const CancelingReasonProvider = ({ children }: CancelingReasonContextProps) => {
  const {
    cancelingReasons,
    isLoadingCancelingReasons,
    cancelingReasonsError,
    fetchCancelingReasons,
  } = useCancelingReasons({ currentPage: 1, searchInputValue: '' });

  const contextValues = useMemo(
    () => ({
      cancelingReasons,
      isLoadingCancelingReasons,
      cancelingReasonsError,
      fetchCancelingReasons,
    }),
    [cancelingReasons, cancelingReasonsError, fetchCancelingReasons, isLoadingCancelingReasons]
  );

  return (
    <CancelingReasonContext.Provider value={contextValues}>
      {children}
    </CancelingReasonContext.Provider>
  );
};
