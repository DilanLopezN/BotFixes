import { PaymentItem } from '../../../../interfaces/payment-item.interface';

export interface PaymentItemFormProps {
    cancel: () => void;
    onClose: () => void;
    paymentItem?: PaymentItem;
}