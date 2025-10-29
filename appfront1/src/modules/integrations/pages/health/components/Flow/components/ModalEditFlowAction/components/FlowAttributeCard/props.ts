import { I18nProps } from './../../../../../../../../../i18n/interface/i18n.interface';
import { Entity, FlowAction } from 'kissbot-core';


export interface FlowAttributeCardProps extends I18nProps {
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  values: FlowAction[];
  index: number;
  onDeleteAction: Function;
  workspaceId: string;
  bots: any[];
  entitiesList: Array<Entity>;
  validation: [];
}