import type { ApiError } from '~/interfaces/api-error';
import { CancelingReason } from '~/interfaces/canceling-reason';

export interface CancelingReasonContextValues {
  cancelingReasons?: CancelingReason[];
  isLoadingCancelingReasons: boolean;
  cancelingReasonsError?: ApiError;
  fetchCancelingReasons: () => void;
}

export interface CancelingReasonContextProps {
  children: React.ReactNode;
}
