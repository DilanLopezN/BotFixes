import { Entity, IButtonAction } from 'kissbot-core';
import { BotAttribute } from './../../../../../../../../../../../model/BotAttribute';
import { I18nProps } from './../../../../../../../../../../i18n/interface/i18n.interface';

export interface AttributeProps extends I18nProps {
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  actions,
  index,
  onDeleteAction: Function;
  botAttributes: BotAttribute[]
  entitiesList: Entity[];
  action: IButtonAction & { maximized: boolean };
  onMaximized: Function;
}