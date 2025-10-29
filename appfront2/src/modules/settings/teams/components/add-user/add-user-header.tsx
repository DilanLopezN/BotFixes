import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';

export const AddUserHeader = () => {
  const { t } = useTranslation();
  const { addUserToTable } = localeKeys.settings.teams.components;
  return <span>{t(addUserToTable.addUser)}</span>;
};
