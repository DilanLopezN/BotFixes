import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me } from '~/interfaces/me';
import { AuthRequests } from '~/services/authentication';
import { AuthContextValues, AuthProviderProps } from './interfaces';

export const AuthContext = createContext<AuthContextValues>({
  user: undefined,
  isAuth: false,
  isAuthenticating: true,
  authenticate: async () => {},
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Me | undefined>();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const { i18n } = useTranslation();

  const isAuth = useMemo(() => Boolean(user), [user]);

  const authenticate = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      const response = await AuthRequests.validateAuth();
      i18n.changeLanguage(response.language);
      setUser(response);
    } catch (error) {
      setUser(undefined);
    } finally {
      setIsAuthenticating(false);
    }
  }, [i18n]);

  const contextValues = useMemo(
    () => ({ user, isAuthenticating, isAuth, authenticate }),
    [authenticate, isAuth, isAuthenticating, user]
  );

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return <AuthContext.Provider value={contextValues}>{children}</AuthContext.Provider>;
};
