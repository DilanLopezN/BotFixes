import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import {
    Content,
    Logo,
    Card,
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
import { FC } from 'react';
import { apiInstanceWithoutToken, doRequest } from '../../../../utils/Http';

interface PasswordResetParams {
    token: string;
}

const PasswordReset: FC = () => {
    const { token } = useParams<PasswordResetParams>();
    const history = useHistory();
    const location = useLocation();

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isValidatingToken, setIsValidatingToken] = useState<boolean>(true);
    const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

    const { settings } = useSelector((state: any) => state.loginReducer);

    // Validar token ao carregar o componente
    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setErrorMessage('Token de recuperação não encontrado');
            setIsValidatingToken(false);
            return;
        }

        try {
            setIsValidatingToken(true);
            const data = { token };

            await doRequest(apiInstanceWithoutToken.post('/password-reset/validate-token', data), true, (error) =>
                setErrorMessage(error)
            );

            setIsTokenValid(true);
        } catch (error) {
            console.error('Erro ao validar token:', error);
            setErrorMessage('Token inválido ou expirado');
            setIsTokenValid(false);
        } finally {
            setIsValidatingToken(false);
        }
    };

    const validatePasswords = () => {
        if (!newPassword) {
            setErrorMessage('Por favor, digite a nova senha');
            return false;
        }

        if (newPassword.length < 6) {
            setErrorMessage('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        if (!confirmPassword) {
            setErrorMessage('Por favor, confirme a nova senha');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('As senhas não coincidem');
            return false;
        }

        return true;
    };

    const handlePasswordReset = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (!validatePasswords()) {
            return;
        }

        setIsLoading(true);

        try {
            const data = {
                token,
                newPassword,
            };

            await doRequest(apiInstanceWithoutToken.post('/password-reset/reset-password', data), true, (error) =>
                setErrorMessage(error)
            );

            setSuccessMessage('Senha alterada com sucesso! Redirecionando para o login...');

            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                history.push('/login');
            }, 3000);
        } catch (error) {
            console.error('Erro ao alterar senha:', error);

            if (error.code === 'TOKEN_EXPIRED') {
                setErrorMessage('Token expirado. Solicite uma nova recuperação de senha');
            } else if (error.code === 'INVALID_TOKEN') {
                setErrorMessage('Token inválido');
            } else {
                setErrorMessage('Erro ao alterar senha. Tente novamente');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handlePasswordReset();
        }
    };

    const getLogo = () => {
        if (settings?.layout?.logo?.original) {
            return settings.layout.logo.original;
        }
        return `/assets/img/bot-logo-compressed.jpg`;
    };

    const handleBackToLogin = () => {
        history.push('/login');
    };

    if (isEmpty(settings)) {
        return null;
    }

    if (isValidatingToken) {
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

                {!isTokenValid ? (
                    <div style={{ textAlign: 'center' }}>
                        <h3>Token Inválido</h3>
                        <ErrorMessage>{errorMessage}</ErrorMessage>
                        <Button onClick={handleBackToLogin} style={{ marginTop: '20px' }}>
                            Voltar ao Login
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Criar Nova Senha</h3>

                        <Input
                            type='password'
                            placeholder='Digite sua nova senha'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            style={{ marginBottom: '15px' }}
                        />

                        <Input
                            type='password'
                            placeholder='Confirme sua nova senha'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            style={{ marginBottom: '15px' }}
                        />

                        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <Button
                                onClick={handleBackToLogin}
                                disabled={isLoading}
                                variant='secondary'
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handlePasswordReset}
                                disabled={isLoading}
                                variant='primary'
                                style={{ flex: 1 }}
                            >
                                {isLoading ? 'Alterando...' : 'Alterar Senha'}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </Content>
    );
};

export default PasswordReset;
