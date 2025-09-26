import Amplify, { Auth } from '@aws-amplify/auth';
import { Cache } from '@aws-amplify/cache';
import { CognitoUserSession, CognitoUser, AuthenticationDetails, CognitoUserPool } from 'amazon-cognito-identity-js';
import { Constants } from '../utils/Constants';

const localStorageCache = Cache.createInstance({
    keyPrefix: 'bd_auth',
    storage: window.localStorage,
});

const credentials = {
    awsRegion: Constants.COGNITO_REGION,
    awsPoolId: Constants.COGNITO_POOL_ID,
    awsWebClientId: Constants.COGNITO_POOL_CLIENT_ID,
};

const amplifyConfig = {
    aws_cognito_region: credentials.awsPoolId,
    aws_user_pools_id: credentials.awsPoolId,
    aws_user_pools_web_client_id: credentials.awsWebClientId,
    storage: localStorageCache,
    app_name: 'dasatest',
    oauth: {
        domain: `dasatest.auth.${Constants.COGNITO_REGION}.amazoncognito.com`,
        scope: ['aws.cognito.signin.user.admin', 'email', 'openid', 'phone', 'profile'],
        redirectSignIn: `${window.location.origin}/users/auth`,
        redirectSignOut: `${window.location.origin}/users/auth`,
        clientId: credentials.awsWebClientId,
        responseType: 'token',
    },
};

Amplify.configure(amplifyConfig);

const userPool = new CognitoUserPool({
    UserPoolId: amplifyConfig.aws_user_pools_id,
    ClientId: amplifyConfig.aws_user_pools_web_client_id,
});

const logout = async () => {
    return await new Promise((resolve, reject) => {
        Auth.signOut().then(resolve).catch(reject);
    });
};

const authenticate = (
    { username, password }: { username: string; password: string },
    onRequirePasswordChange: (userAttr: any) => void,
    onSuccess: (session: CognitoUserSession) => void,
    onError: (err: any) => void
): CognitoUser => {
    const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
    });

    const userData = {
        Username: username,
        Pool: userPool,
        Storage: localStorageCache,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authDetails, {
        onSuccess: onSuccess,
        newPasswordRequired: onRequirePasswordChange,
        onFailure: onError,
    });

    return cognitoUser;
};

const completeNewPasswordChallenge = ({
    cognitoUser,
    newPassword,
    userAttrs,
}: {
    cognitoUser: CognitoUser;
    newPassword: string;
    userAttrs: any;
}): Promise<CognitoUserSession> => {
    return new Promise<CognitoUserSession>((resolve, reject) =>
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttrs, {
            onSuccess: resolve,
            onFailure: reject,
        })
    );
};

/**
 *
 * @param username email | username
 * @param password
 * @returns
 */

const signIn = async ({ username, password }: { username: string; password: string }) => {
    const cognitoUser = await new Promise<CognitoUser | any>((resolve, reject) =>
        Auth.signIn({
            username,
            password,
        })
            .then(resolve)
            .catch(reject)
    );

    if (!cognitoUser) {
        return;
    }

    const userSession = await new Promise<CognitoUserSession>((resolve, reject) =>
        Auth.currentSession().then(resolve).catch(reject)
    );

    return userSession;
};

const changePassword = async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
    return await new Promise<CognitoUser | any>((resolve, reject) =>
        Auth.currentAuthenticatedUser()
            .then((user) => {
                return Auth.changePassword(user, oldPassword, newPassword);
            })
            .then(resolve)
            .catch(reject)
    );
};

const getAuthenticatedUser = async () => {
    return await new Promise<CognitoUser | any>((resolve, reject) =>
        Auth.currentAuthenticatedUser().then(resolve).catch(reject)
    );
};

const getCognitoUserSession = async () => {
    return await new Promise<CognitoUserSession>((resolve, reject) =>
        Auth.currentSession().then(resolve).catch(reject)
    );
};

export {
    logout as cognitoLogout,
    signIn as cognitoSignIn,
    authenticate as cognitoAuthenticate,
    changePassword as cognitoChangePassword,
    completeNewPasswordChallenge,
    getAuthenticatedUser,
    getCognitoUserSession,
};
