import type { ReactNode } from 'react';
import type { Me } from '~/interfaces/me';

export interface AuthContextValues {
  user?: Me;
  isAuth: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
