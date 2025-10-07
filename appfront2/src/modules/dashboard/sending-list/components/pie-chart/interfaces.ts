import { SendingType } from '~/constants/sending-type';

export interface PieChartProps {
  title: string;
  data?: {
    total?: number;
    notAnswered?: number;
    invalidNumber?: number;
    confirmed?: number;
    canceled?: number;
    reschedule?: number;
    open_cvs?: number;
    no_recipient?: number;
    invalid_recipient?: number;
    individual_cancel?: number;
    start_reschedule_recover?: number;
    cancel_reschedule_recover?: number;
    confirm_reschedule_recover?: number;
    recipient_type?: number;
  };
  isLoading?: boolean;
  type?: SendingType;
  shouldShowActions?: boolean;
  height?: number;
}
