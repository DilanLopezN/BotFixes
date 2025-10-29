import { ReactNode } from 'react';
import { OrganizationSettings } from '~/services/organization-settings';

export interface OrganizationSettingsContextValues {
  organizationSettings?: OrganizationSettings;
  isLoading: boolean;
}

export interface OrganizationSettingsProviderProps {
  children: ReactNode;
}
