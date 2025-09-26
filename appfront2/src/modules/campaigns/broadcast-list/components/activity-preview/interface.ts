import { TemplateButtonType } from '~/constants/template-button-type';
import { TemplateVariable } from '~/interfaces/template-message';

export interface ActivityPreviewProps {
  message: string;
  buttons?: { text: string; type: TemplateButtonType }[];
  variables?: TemplateVariable[];
  file?: {
    type: string;
    url: string;
    name: string;
    size: number;
  };
}

export interface ExampleVarsBase {
  [key: string]: any;
}
