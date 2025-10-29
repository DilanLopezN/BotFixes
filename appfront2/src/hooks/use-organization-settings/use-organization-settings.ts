import { useContext } from 'react';
import { OrganizationSettingsContext } from '~/contexts/organization-settings-context';

export const useOrganizationSettings = () => useContext(OrganizationSettingsContext);
