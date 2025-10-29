import { Alert } from 'antd';
import type { ErrorMessageProps } from './interfaces';
import { Container } from './styles';

export const ErrorMessage = ({ description }: ErrorMessageProps) => {
  return (
    <Container>
      <Alert message='Erro' description={description} type='error' showIcon />
    </Container>
  );
};
