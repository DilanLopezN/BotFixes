import type { CognitoUser } from 'amazon-cognito-identity-js';
import { useState } from 'react';
import { useAuth } from '~/hooks/use-auth';
import { cognitoAuthenticate, completeNewPasswordChallenge } from '~/services/amplify-instance';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
import { envConstants } from '../../../constants/authentication';
import { SignInProps } from './interface';

export const useSignIn = () => {
  const { authenticate } = useAuth();
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [requireChangePasswordMetadata, setRequireChangePasswordMetadata] = useState<
    | {
        cognitoUser: CognitoUser;
        userAttrs: any;
      }
    | undefined
  >();

  const cognitoCompleteNewPasswordChallenge = async (
    newPassword: string,
    cognitoUser?: CognitoUser,
    userAttrs?: any
  ) => {
    const user = cognitoUser ?? requireChangePasswordMetadata?.cognitoUser;
    const userAttributes = userAttrs ?? requireChangePasswordMetadata?.userAttrs;

    if (!user || !userAttributes) {
      return;
    }

    try {
      await completeNewPasswordChallenge({
        newPassword,
        userAttrs: userAttributes,
        cognitoUser: user,
      });
    } catch (cognitoError) {
      /*  console.error(cognitoError); */
    }
  };

  const authenticateCognito = (
    email: string,
    password: string,
    resolvePasswordChallangeAuto: boolean
  ) => {
    const cognitoUser = cognitoAuthenticate(
      { username: email, password },
      async (userAttrs) => {
        if (resolvePasswordChallangeAuto) {
          return cognitoCompleteNewPasswordChallenge(password, cognitoUser, userAttrs);
        }

        return setRequireChangePasswordMetadata({
          cognitoUser,
          userAttrs,
        });
      },
      async () => {
        setIsSigningIn(false);
        localStorage.setItem(envConstants.LOCAL_STORAGE_MAP.EMAILLOGIN, email);
        await authenticate();
        redirectApp({ pathname: 'home', appTypePort: AppTypePort.APP });
      },
      (authError) => {
        setIsSigningIn(false);
        if (authError?.code === 'NotAuthorizedException') {
          setError('Credenciais inválidas');
          return;
        }

        setError('Contact your supervisorr');
      }
    );
  };

  const signIn = async ({ email, password, requireCognitoRegistry }: SignInProps) => {
    setIsSigningIn(true);
    setError('');
    try {
      authenticateCognito(email, password, requireCognitoRegistry || false);
    } catch (signInError) {
      const apiError = (signInError as any)?.response?.data;
      if (apiError?.error === 'USER_NOT_FOUND_BY_PASSWORD') {
        setError('Credenciais inválidas');
        setIsSigningIn(false);
      }
    }
  };

  return { signIn, isSigningIn, error };
};
