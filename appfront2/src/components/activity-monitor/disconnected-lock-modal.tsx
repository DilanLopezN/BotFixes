import { Col, Modal, Row, Typography } from 'antd';
import { useUserActivity } from '~/hooks/use-user-activity';
import { notifySuccess } from '~/utils/notify-success';
import { useConnectUser } from './hooks/use-connect-user';
import type { DisconnectedLockModalProps } from './interfaces';

export const DisconnectedLockModal = ({ isModalOpen }: DisconnectedLockModalProps) => {
  const { fetchUserActivity, isLoadingUserActivity } = useUserActivity();
  const { connect, isConnecting } = useConnectUser();

  const handleConnect = async () => {
    const result = await connect();

    if (result) {
      notifySuccess({ message: 'Sucesso', description: 'Usuário conectado' });
      fetchUserActivity();
    }
  };

  return (
    <Modal
      title='Desconectado'
      closable={false}
      keyboard={false}
      maskClosable={false}
      open={isModalOpen}
      okText='Conectar'
      onOk={handleConnect}
      okButtonProps={{
        loading: isConnecting,
        disabled: isLoadingUserActivity,
      }}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Row gutter={[16, 16]}>
        <Col>
          <Typography.Text>
            Você está desconectado. Para voltar a utilizar o sistema, conecte-se novamente.
          </Typography.Text>
        </Col>
      </Row>
    </Modal>
  );
};
