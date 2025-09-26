import { isLocalhost } from './isLocalHost';

const checkEnv = (env) => {
    return !isLocalhost ? env : undefined;
};

export const ConstantsS3 = {
    API_URL: checkEnv(process.env.REACT_APP_API_URL) ?? 'http://localhost:9091',
    CM_URL: checkEnv(process.env.REACT_APP_CM_URL) ?? 'http://localhost:3003',
    INTEGRATIONS_API_URL: checkEnv(process.env.REACT_APP_INTEGRATIONS_API_URL) ?? 'http://localhost:9092',
    COGNITO_POOL_ID: checkEnv(process.env.REACT_APP_COGNITO_POOL_ID) ?? 'sa-east-1_zAobYe8ts',
    COGNITO_POOL_CLIENT_ID: checkEnv(process.env.REACT_APP_COGNITO_POOL_CLIENT_ID) ?? '4vertl1ll5qm6mgbs6cgbk90go',
    COGNITO_REGION: checkEnv(process.env.REACT_APP_COGNITO_REGION) ?? 'sa-east-1',
    CX_CREDENCIAL: checkEnv(process.env.REACT_APP_CX_CREDENCIAL) ?? '',
    LOCAL_STORAGE_MAP: {
        CURRENT_WORKSPACE: '@workspace',
        EMAILLOGIN: '@email',
        END_CONVERSATION_TEXT: '@endConversationText',
        LIVE_AGENT_FILTERS: '@liveAgentFilters',
        LIVE_AGENT_FILTERS_USERS: '@liveAgentFiltersUsers',
        RECENTLY_CHANNELS: '@recentlyChannels',
        LIVE_AGENT_SAVED_MESSAGES: '@liveAgentSavedMessages',
        CHANNEL_TO_START_CONVERSATIONS: '@channelToStartConversation',
        DASHBOARD_FILTER: '@dashboardFilter',
        DASHBOARD_FILTER_GRAPHICS: '@dashboardFilterGraphics',
        APPOINTMENT_FILTER: '@appointmentFilter',
        SOUND_CHAT: '@soundChat',
        PASSWORD_CHANGED: '@passwordChanged',
        TREE_COLLAPSED: '@treeCollapsed',
        LEAVE_CONVERSATION_ON_TRANSFER: '@leaveConversationOntransfer',
        RECENTLY_WORKSPACES: '@recentlyWorkspaces',
        DASHBOARD_REAL_TIME_TEAMS: '@dashboardRealTimeTeams',
        DASHBOARD_REAL_TIME_AGENTS: '@dashboardRealTimeAgents',
    },
    COOKIES: {
        USER_ID: '@userId',
    },
    ENV: 'development',
    WEBCHAT_LAUNCHER_URL: checkEnv(process.env.REACT_APP_WEBCHAT_LAUNCHER_URL) ?? 'http://localhost:5000/bundle.js',
    DEMO_URL: checkEnv(process.env.REACT_DEMO_URL) ?? '',
};
