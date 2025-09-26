interface GeneralConfigs {
  [key: string]: any;
}

interface Settings {
  dialogflowEnabled: boolean;
  dialogflowWritable: boolean;
  dialogflowTemplate: boolean;
}

interface Sso {
  ssoId: string;
  ssoName: string;
}

export interface Workspace {
  _id: string;
  name: string;
  organizationId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  featureFlag?: { [key: string]: boolean };
  settings?: Settings;
  generalConfigs?: GeneralConfigs;
  integrationStatus: any[];
  sso?: Sso;
  dialogFlowAccount?: boolean;
  userFeatureFlag: {
    enableConversationCategorization?: boolean;
  };
}
