import { UserRole } from '~/constants/user-roles';

interface Channel {
  _id: string;
  id: string;
  roles: string[];
}

interface Extension {
  enable: boolean;
  roles: UserRole[];
  extension: string;
}

interface GeneralFeatureFlag {
  [key: string]: any;
}

interface Articles {
  'como-habilitar-notificação-de-um-novo-atendimento': string;
}

interface HelpCenter {
  url: string;
  articles: Articles;
}

interface Logo {
  transparent: string;
  original: string;
}

interface Layout {
  logo: Logo;
  color: string;
  title: string;
}

enum Action {
  Empty = '',
  KissbotFAQ = 'kissbot-faq',
  KissbotPostback = 'kissbot-postback',
  KissbotTags = 'kissbot-tags',
  KissbotText = 'kissbot-text',
}

interface OptionResponse {
  type: string;
  name: string;
  title: string;
  icon: string;
  action: Action;
}

interface Option {
  responses: OptionResponse[];
  name: string;
}

interface TopLevelResponse {
  options: Option[];
  name: string;
  title: string;
  icon: string;
}

interface Script {
  data: string;
  type: string;
  _id: string;
}

export interface OrganizationSettings {
  _id: string;
  organizationId: string;
  channels: Channel[];
  layout: Layout;
  extensions: Extension[];
  createdAt: string;
  updatedAt: string;
  responses: TopLevelResponse[];
  scripts: Script[];
  styles: any[];
  featureFlag: any[];
  helpCenter: HelpCenter;
  generalFeatureFlag: GeneralFeatureFlag;
}
