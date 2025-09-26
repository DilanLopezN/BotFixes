import { I18nProps } from './../../../../../../../../../../i18n/interface/i18n.interface';
import { IButtonAction } from 'kissbot-core';

export interface TagsProps extends I18nProps {
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  actions: IButtonAction[] | any[];
  index: number;
  onDeleteAction: Function;
  action: IButtonAction & { maximized: boolean };
  onMaximized: Function;
}