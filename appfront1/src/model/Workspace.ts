import { BaseModel } from './BaseModel';

export enum SSONameInterface {
    dasa = 'dasa',
    bot = 'bot',
}

interface WorkspaceSSO {
    ssoId: string;
    ssoName: SSONameInterface;
}

export interface FeatureFlag {
    enableChannelApi: boolean;
    enableModuleIntegrations: boolean;
    showMessageUserLimit: boolean;
    campaign: boolean;
    showHelpCenter: boolean;
    enableModuleBillings: boolean;
    disabledWorkspace: boolean;
    createTemplateWhatsappOfficial: boolean;
    enableAutoAssign: boolean;
    enableConfirmation: boolean;
    enableReminder: boolean;
    enableNps: boolean;
    enableMedicalReport: boolean;
    showSubRolesInUser: boolean;
    enableIVR: boolean;
    enableScheduleNotification: boolean;
    enableRecoverLostSchedule: boolean;
    enableNpsScore: boolean;
    enableDocumentsRequest: boolean;
    enableActiveMkt: boolean;
    enableTelegram: boolean;
    activeMessage: boolean;
    enableAudioTranscription: boolean;
    enableBotAudioTranscription: boolean;
    categorizationDashboard: boolean;
    enableUploadErpDocuments: boolean;
    enableModuleWhatsappFlow: boolean;
    enableRemi: boolean;
    enableAutomaticDistribution: boolean;

    enableContactV2: boolean; // flag para ativar o novo contato v2
    enableRuleAssumeByPermission: boolean; // flag temporaria para ativar verificação se deve ativar regra para assumir atendimento com permissao
}

export interface AdvancedModuleFeatures {
    enableAgentStatus: boolean;
}

export enum NotificationSongs {
    'OPTION_1' = 'option1',
    'OPTION_2' = 'option2',
    'OPTION_3' = 'option3',
    'OPTION_4' = 'option4',
}

export interface GeneralConfigs {
    notificationSong: NotificationSongs;
    enableCampaignAllUsers?: boolean;
    enableAutomaticSendingListAllUsers?: boolean;
    enableEditProfileAllUsers?: boolean;
    enableIndividualCancelInConfirmation?: boolean;
    enableAutoCompleteTemplateVariables?: boolean;
    enableAgentsTeamHistoryAccess?: boolean;
    enableConcatAgentNameInMessage?: boolean;
    enableRating?: boolean;
    enableIgnoreUserFollowupConversation?: boolean;
}

export interface CustomerXSettings {
    id: string;
    email: string;
}

export interface Workspace extends BaseModel {
    name: string;
    description: string;
    ownerId: string;
    integrations?: any[];
    dialogFlowAccount?: DialogFlowAccount;
    sso: WorkspaceSSO;
    restrictedIp?: boolean;
    featureFlag: FeatureFlag;
    timezone?: string;
    generalConfigs?: GeneralConfigs;
    customerXSettings?: CustomerXSettings;
    integrationStatus: { name: string; online: boolean; env: string; since: number; integrationId: string }[];
    analyticsRanges?: Record<string, any>;
    advancedModuleFeatures: AdvancedModuleFeatures;
    userFeatureFlag: {
        enableConversationCategorization?: boolean;
        enableRemi?: boolean;
        enableRatingDetails?: boolean;
    };
}

export interface DialogFlowAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_id: string;
    client_email: string;
}
