import { Document } from 'mongoose';
import { DialogFlowAccount } from './dialogflowAccount.interface';
import { WorkspaceSettings } from './workspaceSettings.interface';

export interface WorkspaceSSO {
    ssoId: string;
    /**
     * Deve representar o nome da integração do enum LoginMethod do usuario
     */
    ssoName: string;
}

export interface FeatureFlag {
    rating: boolean;
    enableChannelApi: boolean;
    dashboardNewVersion: boolean;
    enableModuleIntegrations: boolean;
    showMessageUserLimit: boolean;
    campaign: boolean;
    showHelpCenter: boolean;
    enableModuleBillings: boolean;
    disabledWorkspace: boolean;
    dashboardAppointments: boolean;
    dashboardMessages: boolean;
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
    enableTelegram: boolean;
    activeMessage: boolean;
    enableAudioTranscription: boolean;
    enableBotAudioTranscription: boolean;
    categorizationDashboard: boolean;
    enableUploadErpDocuments: boolean;
    enableConcatAgentNameInMessage: boolean;
    enableContactV2: boolean;
}

export enum NotificationSongs {
    'OPTION_1' = 'option1',
    'OPTION_2' = 'option2',
    'OPTION_3' = 'option3',
    'OPTION_4' = 'option4',
}

export interface GeneralConfigs {
    notificationSong: NotificationSongs;
    enableCampaignAllUsers: boolean;
    enableAutomaticSendingListAllUsers: boolean;
    enableEditProfileAllUsers: boolean;
    enableIndividualCancelInConfirmation: boolean;
    enableAutoCompleteTemplateVariables: boolean;
    enableAgentsTeamHistoryAccess: boolean;
}

export interface CustomerXSettings {
    id: string;
    email: string;
}

export interface UserFeatureFlag {
    enableConversationCategorization: boolean;
    enableRemi: boolean;
}

export interface Workspace extends Document {
    name: string;
    description: string;
    dialogFlowAccount: DialogFlowAccount;
    settings: WorkspaceSettings;
    sso: WorkspaceSSO;
    featureFlag: FeatureFlag;
    generalConfigs: GeneralConfigs;
    customerXSettings?: CustomerXSettings;
    userFeatureFlag: UserFeatureFlag;
    analyticsRanges?: Record<string, any>;
}
