import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';

export const AddUserPermissionHeader = () => {
  const { t } = useTranslation();
  const { addUserPermission } = localeKeys.settings.teams.components;

  return <span>{t(addUserPermission.addPermissions)}</span>;
};
