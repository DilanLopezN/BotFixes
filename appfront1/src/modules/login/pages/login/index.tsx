import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoginActions } from '../../redux/actions';
import LoginForm from '../../components/login-form';
import { useHistory, useLocation } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import {
    Content,
    Logo,
    Card,
    ForgotPasswordLink,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    CloseButton,
    Input,
    Button,
    ErrorMessage,
    SuccessMessage,
} from './styles';
import { LoadingArea, Spin } from '../../../../shared/Spin/spin';
import { cognitoAuthenticate, cognitoLogout, completeNewPasswordChallenge } from '../../../../helpers/amplify-instance';
import { UserService } from '../../../settings/service/UserService';
import { FC } from 'react';
import { LoginProps } from './props';
import { LoginMethod } from '../../interfaces/login';
import { CognitoUser } from 'amazon-cognito-identity-js';
import ChangeInitialPasswordForm from '../../components/change-initial-password-form';
import { LoginService } from '../../services/LoginService';
import { Auth } from '@aws-amplify/auth';
import { redirectAfterLoginPath } from '../../../../utils/UserPermission';
import { dispatchSentryError } from '../../../../utils/Sentry';
import { parseQueryStringToObj } from '../../../../utils/parse-query-string-to-obj';
import { apiInstanceWithoutToken, doRequest } from '../../../../utils/Http';

const Login: FC<LoginProps> = () => {
    const { search } = useLocation();
    const [loginErrorMessage, setLoginErrorMessage] = useState<string>('');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string>('');
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string>('');
    const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState<boolean>(false);
    const [invalidCurrentPasswordMetadata, setInvalidCurrentPasswordMetadata] = useState<
        { email: string; password: string } | undefined
    >();
    const [requireChangePassword, setRequireChangePassword] = useState<boolean>(false);
    const [numberOfTries, setNumberOfTries] = useState<number>(0);
    const [requireChangePasswordMetadata, setRequireChangePasswordMetadata] = useState<
        | {
              cognitoUser: CognitoUser;
              userAttrs: any;
          }
        | undefined
    >();

    const dispatch = useDispatch();
    const history = useHistory();

    const { loggedUser, settings } = useSelector((state: any) => state.loginReducer);

    const authenticateCognito = (email: string, password: string, resolvePasswordChallangeAuto: boolean) => {
        const cognitoUser = cognitoAuthenticate(
            { username: email, password },
            async (userAttrs) => {
                // troca senha automaticamente de usuários já cadastrados na plataforma
                if (resolvePasswordChallangeAuto) {
                    return await cognitoCompleteNewPasswordChallenge(password, cognitoUser, userAttrs);
                }
                handleChangeRequireChange(true);
                return setRequireChangePasswordMetadata({
                    cognitoUser,
                    userAttrs,
                });
            },
            async () => {
                const user = await UserService.authenticatedByToken();
                return dispatch(LoginActions.login(user) as any);
            },
            (error) => {
                if (numberOfTries === 5) {
                    dispatchSentryError(new Error(`WORKSPACE_PASSWORD_EXCEPTION: email: ${email}`));
                }
                if (error?.code === 'NotAuthorizedException') {
                    setNumberOfTries((prevNumberOfTries) => prevNumberOfTries + 1);
                    return setLoginErrorMessage('Credenciais inválidas');
                }
                return setLoginErrorMessage('Entre em contato com seu supervisor');
            }
        );
    };

    const redirect = (loggedUser) => {
        if (!loggedUser?._id) {
            return;
        }
        const { redirect_url } = parseQueryStringToObj<{ redirect_url?: string }>(search);

        if (redirect_url) {
            window.location.href = redirect_url;
            return;
        }

        const routeToRedirect = redirectAfterLoginPath(loggedUser);
        return history.push(routeToRedirect);
    };

    useEffect(() => {
        return redirect(loggedUser);
    }, []);

    const doLogin = async ({ email, password }, loginMethod: LoginMethod, requireCognitoRegistry: boolean) => {
        setLoginErrorMessage('');

        switch (loginMethod) {
            case LoginMethod.bot:
                return await cognitoPasswordLogin(email, password, requireCognitoRegistry);

            default:
                return Auth.federatedSignIn({ provider: 'dasa' as any });
        }
    };

    const handleChangeRequireChange = (value: boolean) => {
        setRequireChangePassword(value);
        setLoginErrorMessage('');
    };

    const cognitoPasswordWithNewPasswordLogin = async (email: string, password: string, newPassword: string) => {
        let error: any;
        const response = await LoginService.cognitoRegistry({ email, password, newPassword }, (err) => {
            error = err;
        });

        if (error?.error === 'USER_NOT_FOUND_BY_PASSWORD') {
            return setLoginErrorMessage('Credenciais inválidas');
        }

        if (!response?._id) {
            return setLoginErrorMessage('Entre em contato com seu supervisor');
        }

        return authenticateCognito(email, newPassword, true);
    };

    const cognitoPasswordLogin = async (email: string, password: string, requireCognitoRegistry: boolean) => {
        // se a senha atual do usuario tem menos de 6 caracteres, solicita nova senha para cadastro no cognito
        if (requireCognitoRegistry && password.length < 6) {
            let error: any;
            const user = await LoginService.validateCredentials({ email, password }, (err) => {
                error = err;
            });

            if (error?.error === 'USER_NOT_FOUND_BY_PASSWORD') {
                return setLoginErrorMessage('Credenciais inválidas');
            }

            if (!error && user) {
                return setInvalidCurrentPasswordMetadata({ email, password });
            }
        }

        if (requireCognitoRegistry) {
            let error: any;
            const response = await LoginService.cognitoRegistry({ email, password }, (err) => {
                error = err;
            });

            if (error?.error === 'USER_NOT_FOUND_BY_PASSWORD') {
                return setLoginErrorMessage('Credenciais inválidas');
            }

            if (!response?._id) {
                return setLoginErrorMessage('Entre em contato com seu supervisor');
            }
        }

        return authenticateCognito(email, password, requireCognitoRegistry);
    };

    const cognitoCompleteNewPasswordChallenge = async (
        newPassword: string,
        cognitoUser?: CognitoUser,
        userAttrs?: any
    ) => {
        cognitoUser = cognitoUser ?? requireChangePasswordMetadata?.cognitoUser;
        userAttrs = userAttrs ?? requireChangePasswordMetadata?.userAttrs;

        if (!cognitoUser || !userAttrs) {
            return;
        }

        try {
            await completeNewPasswordChallenge({
                newPassword,
                userAttrs,
                cognitoUser,
            });

            const user = await UserService.authenticatedByToken();
            return dispatch(LoginActions.login(user) as any);
        } catch (error) {
            console.log(error);
            if (error?.code === 'NotAuthorizedException') {
                return handleChangeRequireChange(false);
            }
        }
    };

    const handleForgotPassword = () => {
        setShowForgotPasswordModal(true);
        setForgotPasswordError('');
        setForgotPasswordSuccess('');
        setForgotPasswordEmail('');
    };

    const handleCloseForgotPasswordModal = () => {
        setShowForgotPasswordModal(false);
        setForgotPasswordError('');
        setForgotPasswordSuccess('');
        setForgotPasswordEmail('');
        setIsLoadingForgotPassword(false);
    };

    const handleSendForgotPasswordRequest = async () => {
        if (!forgotPasswordEmail) {
            setForgotPasswordError('Por favor, digite seu email');
            return;
        }

        if (!forgotPasswordEmail.includes('@')) {
            setForgotPasswordError('Por favor, digite um email válido');
            return;
        }

        setIsLoadingForgotPassword(true);
        setForgotPasswordError('');
        setForgotPasswordSuccess('');

        try {
            const data = {
                email: forgotPasswordEmail,
            };

            let error;
            await doRequest(apiInstanceWithoutToken.post('/password-reset/request-password-reset', data), true, (e) => {
                if (e.error === 'USER_NOT_FOUND' || e.error === 'USER_IS_NOT_ANY_WS_ADMIN') {
                    error = e;
                    setForgotPasswordError('Entre em contato com seu supervisor');
                }
            });

            if (!error) {
                setForgotPasswordSuccess(
                    'Se o seu endereço de e-mail existir em nosso banco de dados, você receberá um link de recuperação de senha em seu endereço de e-mail em alguns minutos.'
                );
                setTimeout(() => {
                    handleCloseForgotPasswordModal();
                }, 5000);
            }
        } catch (error) {
            setForgotPasswordSuccess('');
        } finally {
            setIsLoadingForgotPassword(false);
        }
    };

    const getLogo = () => {
        if (settings?.layout?.logo?.original) {
            return settings.layout.logo.original;
        }
        return `/assets/img/bot-logo-compressed.jpg`;
    };

    if (isEmpty(settings)) {
        return null;
    }

    if (!!loggedUser?._id) {
        return (
            <LoadingArea>
                <Spin />
            </LoadingArea>
        );
    }

    return (
        <Content>
            <Card>
                <Logo src={getLogo()} alt='Botdesigner logo' />
                {requireChangePassword || invalidCurrentPasswordMetadata ? (
                    <ChangeInitialPasswordForm
                        loginErrorMessage={loginErrorMessage}
                        onChange={(newPassword) => {
                            if (invalidCurrentPasswordMetadata) {
                                return cognitoPasswordWithNewPasswordLogin(
                                    invalidCurrentPasswordMetadata.email,
                                    invalidCurrentPasswordMetadata.password,
                                    newPassword
                                );
                            }
                            return cognitoCompleteNewPasswordChallenge(newPassword);
                        }}
                        onLogout={() => {
                            cognitoLogout();
                            setInvalidCurrentPasswordMetadata(undefined);
                            handleChangeRequireChange(false);
                            setRequireChangePasswordMetadata(undefined);
                        }}
                    />
                ) : (
                    <>
                        <LoginForm
                            onUserDontExists={() => {
                                setLoginErrorMessage('Email não existe');
                            }}
                            loginErrorMessage={loginErrorMessage}
                            onSubmit={doLogin}
                        />
                        <ForgotPasswordLink onClick={handleForgotPassword}>Esqueci minha senha</ForgotPasswordLink>
                    </>
                )}
            </Card>

            {/* Modal Esqueci Minha Senha */}
            {showForgotPasswordModal && (
                <Modal onClick={handleCloseForgotPasswordModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <h3>Recuperar Senha</h3>
                            <CloseButton onClick={handleCloseForgotPasswordModal}>×</CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            <p>Digite seu email para receber as instruções de recuperação de senha:</p>
                            <Input
                                type='email'
                                placeholder='Digite seu email'
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendForgotPasswordRequest();
                                    }
                                }}
                                disabled={isLoadingForgotPassword}
                            />
                            {forgotPasswordError && typeof forgotPasswordError === 'string' && (
                                <ErrorMessage>{forgotPasswordError}</ErrorMessage>
                            )}
                            {forgotPasswordSuccess && typeof forgotPasswordSuccess === 'string' && (
                                <SuccessMessage>{forgotPasswordSuccess}</SuccessMessage>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                onClick={handleCloseForgotPasswordModal}
                                disabled={isLoadingForgotPassword}
                                variant='secondary'
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSendForgotPasswordRequest}
                                disabled={isLoadingForgotPassword}
                                variant='primary'
                            >
                                {isLoadingForgotPassword ? 'Enviando...' : 'Enviar'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </Content>
    );
};

export default Login;
