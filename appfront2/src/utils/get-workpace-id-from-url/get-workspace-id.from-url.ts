export const getWorkspaceIdFromUrl = () =>
  window.location.pathname.replace(/(\/v2\/)([a-z\d]+)(\/.*)/g, '$2');
