import { RecipientTypeEnum } from '../../constants';

export interface RecipientTypeProps {
  recipientType: RecipientTypeEnum | null;
  setRecipientType: (recipientType: RecipientTypeEnum | null) => void;
}
export interface DataType {
  key: string;
  description: string;
}
