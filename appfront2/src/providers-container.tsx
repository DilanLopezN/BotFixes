import { I18nextProvider } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { GaPageViewTracker } from './components/ga-page-view-tracker';
import { AuthProvider } from './contexts/auth-context';
import { OrganizationSettingsProvides } from './contexts/organization-settings-context';
import { WorkspaceProvider } from './contexts/workspace-context';
import { GlobalStyles } from './global-styles';
import { i18n } from './i18n';
import { AntdLanguageProvider } from './providers/antd-language-provider';

export const ProvidersContainer = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <AntdLanguageProvider>
          <OrganizationSettingsProvides>
            <WorkspaceProvider>
              <Outlet />
              <GaPageViewTracker />
              <GlobalStyles />
            </WorkspaceProvider>
          </OrganizationSettingsProvides>
        </AntdLanguageProvider>
      </AuthProvider>
    </I18nextProvider>
  );
};
