import { FlowCategoryEnum } from '~/constants/flow-category';
import { Flow } from './flow';
import { TemplateMessage } from './template-message';

export interface FlowVariable {
  name: string;
  value: string;
  description: string;
  type?: 'boolean' | 'string' | 'number';
}

export interface FlowData {
  id: number;
  workspaceId: string;
  name: string;
  flowId: number;
  flowScreen: string;
  data: Record<string, string>;
  flow?: Flow;
}

export interface WhatsappFlowLibrary {
  id: number;
  friendlyName: string;
  flowCategoryIds: number[];
  flowJSON: Record<string, any>;
  variablesOfFlowData?: FlowVariable[];
  templateMessageData?: Partial<TemplateMessage>;
  flowFields: Record<string, any>;
  flowPreviewData: Record<string, any>;
  flows: Flow[];
  flowCategories: FlowCategoryEnum[];
  flowPreviewUrl: string;
}

export interface FlowCategory {
  id: number;
  category: FlowCategoryEnum;
}
