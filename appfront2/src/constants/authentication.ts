const envConstants = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:9091',
  LOCAL_STORAGE_MAP: {
    EMAILLOGIN: '@email',
  },
  ENV: 'development',
  COGNITO_POOL_ID: process.env.REACT_APP_COGNITO_POOL_ID || 'sa-east-1_zAobYe8ts',
  COGNITO_POOL_CLIENT_ID:
    process.env.REACT_APP_COGNITO_POOL_CLIENT_ID || '4vertl1ll5qm6mgbs6cgbk90go',
  COGNITO_REGION: process.env.REACT_APP_COGNITO_REGION || 'sa-east-1',
};

export { envConstants };
