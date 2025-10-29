import { Form, message } from 'antd';
import { useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
import { notifyError } from '~/utils/notify-error';

import { apiInstanceWithoutToken, doRequest } from '~/services/api-instance';
import { Container, Content, Logo, StyledButton, StyledText } from './styles';
import Botlogo from './bot-logo-compressed.jpg';

export const RecoverMail = () => {
  const params = useParams<{ token: string }>();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [form] = Form.useForm();

  const changeUserMail = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const data = {
        token: params.token,
      };

      await doRequest(apiInstanceWithoutToken.post('/mail-reset/reset-mail', data));

      // Só mostra sucesso e atualiza estado após confirmação da API
      message.success('Email atualizado com sucesso!');
      setIsSuccess(true);
    } catch (error) {
      notifyError(error);
      message.error('Erro ao atualizar o email. Por favor, tente novamente.');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [params.token]);

  const handleLogin = () => {
    redirectApp({
      appTypePort: AppTypePort.APP,
      pathname: '/users/login',
    });
  };

  // Executa a troca de email automaticamente quando o componente carrega
  useEffect(() => {
    if (params.token) {
      changeUserMail();
    }
  }, [changeUserMail, params.token]);

  return (
    <Container>
      <Content>
        <Logo src={Botlogo} alt='Botdesigner logo' />
        <StyledText>
          {(() => {
            if (isLoading) return 'Alterando seu e-mail...';
            if (isSuccess) return 'Email alterado com sucesso!';
            if (hasError) return 'Erro ao realizar alteração de e-mail, tente novamente!';
            return 'Preparando alteração...';
          })()}
        </StyledText>
        <Form layout='vertical' form={form}>
          {isSuccess ? (
            <StyledButton type='primary' onClick={handleLogin}>
              Realizar Login
            </StyledButton>
          ) : (
            <StyledButton type='primary' loading={isLoading} disabled>
              {isLoading ? 'Processando...' : 'Confirmar'}
            </StyledButton>
          )}
        </Form>
      </Content>
    </Container>
  );
};
