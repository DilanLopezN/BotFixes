import { ConfigProvider } from 'antd';
import { useAuth } from '~/hooks/use-auth';
import { antdLanguageMap } from './constants';
import type { AntdLanguageProviderProps } from './interfaces';

export const AntdLanguageProvider = ({ children }: AntdLanguageProviderProps) => {
  const { user } = useAuth();

  const selectedLanguage = user
    ? antdLanguageMap[user.language as keyof typeof antdLanguageMap]
    : antdLanguageMap.pt;

  return <ConfigProvider locale={selectedLanguage}>{children}</ConfigProvider>;
};
