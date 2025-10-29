import { isLocalhost } from './isLocalHost';

//manter esse arquivo como está, está integrado com o CI
let _ENV = 'ENV';
let _BASE_URL = 'BASE_URL';
let _API_URL = 'API_URL';
let _LAUNCHER_URL = 'LAUNCHER_URL';
let _WEBCHAT_LAUNCHER_URL = 'WEBCHAT_LAUNCHER_URL';
let _CM_URL = 'CM_URL';
let _DEMO_URL = 'DEMO_URL';
let _COGNITO_POOL_ID = 'COGNITO_POOL_ID';
let _COGNITO_POOL_CLIENT_ID = 'COGNITO_POOL_CLIENT_ID';
let _COGNITO_REGION = 'COGNITO_REGION';
let _INTEGRATIONS_API_URL = 'INTEGRATIONS_API_URL';
let _CX_CREDENCIAL = 'CX_CREDENCIAL';

const checkURL = (envs) => {
    if (envs === 'ENV') return false;
    return envs.indexOf('http') >= 0;
};

const checkEnv = (env) => {
    return !isLocalhost ? env : undefined;
};

export const Constants = {
    API_URL: checkURL(_API_URL) ? _API_URL : process.env.REACT_APP_API_URL ?? 'http://localhost:9091',
    CM_URL: checkURL(_CM_URL) ? _CM_URL : process.env.REACT_APP_CM_URL ?? 'http://localhost:3003',
    INTEGRATIONS_API_URL: checkURL(_INTEGRATIONS_API_URL) ? _INTEGRATIONS_API_URL : 'http://localhost:9092',
    COGNITO_POOL_ID: checkEnv(_COGNITO_POOL_ID) ?? 'sa-east-1_zAobYe8ts',
    COGNITO_POOL_CLIENT_ID: checkEnv(_COGNITO_POOL_CLIENT_ID) ?? '4vertl1ll5qm6mgbs6cgbk90go',
    COGNITO_REGION: checkEnv(_COGNITO_REGION) ?? 'sa-east-1',
    CX_CREDENCIAL: checkEnv(_CX_CREDENCIAL) ?? '',
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
        DASHBOARD_PERFORMANCE_AGENTS: '@dashboardPerformanceAgents',
    },
    COOKIES: {
        USER_ID: '@userId',
    },
    ENV: 'development',
    WEBCHAT_LAUNCHER_URL: checkURL(_WEBCHAT_LAUNCHER_URL) ? _WEBCHAT_LAUNCHER_URL : 'http://localhost:5000/bundle.js',
    DEMO_URL: checkURL(_DEMO_URL) ? _DEMO_URL : ['development'],
};
