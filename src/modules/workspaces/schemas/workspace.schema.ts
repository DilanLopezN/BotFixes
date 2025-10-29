import * as mongoose from 'mongoose';
import { NotificationSongs, Workspace } from '../interfaces/workspace.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { FeatureFlagSchema } from './feature-flag.schema';
import { UserFeatureFlagSchema } from './user-feature-flag.schema';

export const DialogflowAccountSchema = new mongoose.Schema(
    {
        type: String,
        project_id: String,
        private_key_id: String,
        private_key: String,
        client_email: String,
        client_id: String,
    },
    { versionKey: false },
);

export const WorkspaceSettingsSchema = new mongoose.Schema(
    {
        dialogflowEnabled: Boolean,
        dialogflowWritable: Boolean,
        dialogflowTemplate: Boolean,
    },
    { versionKey: false, _id: false },
);

export const WorkspaceSSOSchema = new mongoose.Schema(
    {
        ssoId: String,
        ssoName: String,
    },
    { versionKey: false, _id: false },
);

export const GeneralConfigsSchema = new mongoose.Schema(
    {
        notificationSong: {
            type: String,
            enum: [...Object.values(NotificationSongs)],
            default: NotificationSongs.OPTION_1,
        },
        // habilita lista de transmissão para todos os usuarios,
        // permitir alterar apenas se possui a featureFlag campaign ativa
        enableCampaignAllUsers: Boolean,
        // habilita listagem dos envios automaticos efetuados pela (confirmação, lembrete, nps, ...) para todos usuarios
        enableAutomaticSendingListAllUsers: Boolean,
        enableEditProfileAllUsers: Boolean,
        enableIndividualCancelInConfirmation: Boolean,
        enableAutoCompleteTemplateVariables: Boolean,
        enableAgentsTeamHistoryAccess: Boolean,
        enableAgentStatusForAgents: Boolean,
        ignoreUserFollowupConversation: Boolean,
        enableRating: Boolean, //de FeatureFlag
        enableConcatAgentNameInMessage: Boolean
    },
    { versionKey: false, _id: false, strict: false }, // com strict = false permite adicionar outras chaves que não estejam listadas no enum
);

export const AdvancedModuleFeaturesSchema = new mongoose.Schema(
    {
        enableAgentStatus: Boolean,
    },
    { versionKey: false, _id: false },
);

export const CustomerXSettingsSchema = new mongoose.Schema(
    {
        id: String,
        email: String,
    },
    { versionKey: false, _id: false },
);

export const WorkspaceSchema = new mongoose.Schema(
    {
        name: String,
        description: String,
        dialogFlowAccount: DialogflowAccountSchema,
        settings: WorkspaceSettingsSchema,
        sso: WorkspaceSSOSchema,
        featureFlag: { type: FeatureFlagSchema, default: {} },
        generalConfigs: { type: GeneralConfigsSchema, default: {} },
        customerXSettings: CustomerXSettingsSchema,
        userFeatureFlag: UserFeatureFlagSchema,
        advancedModuleFeatures: AdvancedModuleFeaturesSchema,
        analyticsRanges: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
        },
    },
    { versionKey: false, collection: 'workspaces', strictQuery: true },
);

WorkspaceSchema.plugin(AfterFindSoftDeletePlugin, {});
WorkspaceSchema.plugin(TimesmapPlugin, {});

export const WorkspaceModel: mongoose.Model<Workspace> = mongoose.model<Workspace>('Workspace', WorkspaceSchema);
