import { FlowAction } from 'kissbot-core';
import { I18nProps } from './../../../../../../../../../i18n/interface/i18n.interface';

export interface FlowTagCardProps extends I18nProps {
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  values: FlowAction[];
  index: number;
  onDeleteAction: Function;
  validation: [];
}