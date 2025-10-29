import { Form, Input } from 'antd';
import { envConstants } from '../../constants/authentication';
import type { LoginFormValues } from './interfaces';
import { Container, Content, Logo, StyledButton } from './styles';
import { useSignIn } from './use-sign-in';

export const Login = () => {
  const { signIn, isSigningIn, error } = useSignIn();

  const savedEmail = localStorage.getItem(envConstants.LOCAL_STORAGE_MAP.EMAILLOGIN) || '';

  const handleSubmit = ({ email, password }: LoginFormValues) => {
    signIn({ email, password });
  };

  return (
    <Container>
      <Content>
        <Logo src='/assets/img/bot-logo-compressed.jpg' alt='Botdesigner logo' />
        <Form
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={{ email: savedEmail, password: '' }}
        >
          <Form.Item name='email' label='Email'>
            <Input type='email' />
          </Form.Item>
          <Form.Item name='password' label='Senha'>
            <Input.Password />
          </Form.Item>
          <StyledButton type='primary' htmlType='submit' loading={isSigningIn}>
            Entrar
          </StyledButton>
          <div className='row mt-2'>
            {error ? <div className='col-12 warning-login'>{error}</div> : null}
          </div>
        </Form>
      </Content>
    </Container>
  );
};
