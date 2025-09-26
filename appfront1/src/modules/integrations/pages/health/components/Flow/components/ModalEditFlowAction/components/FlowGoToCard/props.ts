import { I18nProps } from './../../../../../../../../../i18n/interface/i18n.interface';
import { Workspace } from '../../../../../../../../../../model/Workspace';
import { FlowAction } from 'kissbot-core';


export interface FlowGoToCardProps extends I18nProps {
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  values: FlowAction[];
  index: number;
  onDeleteAction: Function;
  workspaceList: Workspace[];
  workspaceId: string;
  validation: [];
}