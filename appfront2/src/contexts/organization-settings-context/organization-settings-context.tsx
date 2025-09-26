import { createContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '~/hooks/use-auth';
import {
  organizationSettingsRequests,
  type OrganizationSettings,
} from '~/services/organization-settings';
import type {
  OrganizationSettingsContextValues,
  OrganizationSettingsProviderProps,
} from './interfaces';

export const OrganizationSettingsContext = createContext<OrganizationSettingsContextValues>({
  organizationSettings: undefined,
  isLoading: true,
});

export const OrganizationSettingsProvides = ({ children }: OrganizationSettingsProviderProps) => {
  const { isAuth } = useAuth();
  const [organizationSettings, setOrganizationSettings] = useState<
    OrganizationSettings | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);

  const contextValues = useMemo(
    () => ({ organizationSettings, isLoading }),
    [isLoading, organizationSettings]
  );

  useEffect(() => {
    if (!isAuth) return;

    const fetchOrganizationSettings = async () => {
      try {
        setIsLoading(true);
        const response = await organizationSettingsRequests.getSettings();
        setOrganizationSettings(response);
      } catch (error) {
        setOrganizationSettings(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationSettings();
  }, [isAuth]);

  return (
    <OrganizationSettingsContext.Provider value={contextValues}>
      {children}
    </OrganizationSettingsContext.Provider>
  );
};
