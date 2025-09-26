import { I18nProps } from './../../../../../../../../../i18n/interface/i18n.interface';

export interface MenuLeftActionsProps extends I18nProps {
  values: [];
  onchange: Function;
  index: number;
  onDeleteAction: Function;
}