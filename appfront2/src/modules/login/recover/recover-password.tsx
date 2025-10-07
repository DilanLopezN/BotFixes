import { Form, Input, message } from 'antd';
import { useParams } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
import { notifyError } from '~/utils/notify-error';

import { apiInstanceWithoutToken, doRequest } from '~/services/api-instance';
import { Container, Content, Logo, StyledButton } from './styles';
import Botlogo from './bot-logo-compressed.jpg';

export const RecoverPassword = () => {
  const params = useParams<{ token: string }>();

  const [form] = Form.useForm();
  const [newPassword, setNewPassword] = useState('');

  const changeUserPassword = useCallback(
    async (values: { newPassword: string; confirmPassword: string }) => {
      try {
        const data = {
          token: params.token,
          newPassword: values.newPassword,
        };

        await doRequest(apiInstanceWithoutToken.patch('/password-reset/reset-password', data));
        message.success('Senha atualizada com sucesso!');
        redirectApp({
          appTypePort: AppTypePort.APP,
          pathname: '/users/login',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        notifyError(errorMessage);
        message.error('Erro ao atualizar a senha. Por favor, tente novamente.');
      }
    },
    [params.token]
  );

  // Validação personalizada para confirmar se as senhas são iguais
  const validateConfirmPassword = (_: any, value: string) => {
    if (!value || form.getFieldValue('newPassword') === value) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('As senhas não coincidem'));
  };

  // Função para verificar validações da senha
  const getPasswordValidations = (password: string) => {
    return {
      required: password.length > 0,
      minLength: password.length >= 8,
      maxLength: password.length <= 20,
      specialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  };

  const validations = getPasswordValidations(newPassword);

  return (
    <Container>
      <Content>
        <Logo src={Botlogo} alt='Botdesigner logo' />

        <Form layout='vertical' form={form} onFinish={changeUserPassword}>
          <Form.Item
            name='newPassword'
            label='Nova senha'
            rules={[{ required: true, message: 'Por favor, informe sua nova senha' }]}
          >
            <Input.Password
              placeholder='Sua nova senha'
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            label='Confirme nova senha'
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Por favor, confirme sua nova senha' },
              { validator: validateConfirmPassword },
            ]}
          >
            <Input.Password placeholder='Confirme sua nova senha' />
          </Form.Item>

          {/* Lista de validações */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: validations.required ? '#52c41a' : '#d9d9d9',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: validations.required ? '#52c41a' : '#d9d9d9',
                  marginRight: '8px',
                }}
              />
              Campo obrigatório
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: validations.minLength ? '#52c41a' : '#d9d9d9',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: validations.minLength ? '#52c41a' : '#d9d9d9',
                  marginRight: '8px',
                }}
              />
              Pelo menos 8 caracteres
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: validations.maxLength ? '#52c41a' : '#d9d9d9',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: validations.maxLength ? '#52c41a' : '#d9d9d9',
                  marginRight: '8px',
                }}
              />
              Máximo de 20 caracteres
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: validations.specialChar ? '#52c41a' : '#d9d9d9',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: validations.specialChar ? '#52c41a' : '#d9d9d9',
                  marginRight: '8px',
                }}
              />
              Sua senha deve conter pelo menos um caractere especial
            </div>
          </div>

          <StyledButton type='primary' htmlType='submit'>
            Alterar
          </StyledButton>
        </Form>
      </Content>
    </Container>
  );
};
