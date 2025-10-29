import { Alert, Col, Modal, Row, Spin, Typography } from 'antd';
import { useState } from 'react';
import { useInterval } from '../../hooks/use-interval';
import { useUserActivity } from '../../hooks/use-user-activity';
import { UserActivity } from '../../interfaces/user-activity';
import { notifySuccess } from '../../utils/notify-success';
import { useConnectUser } from './hooks/use-connect-user';
import type { IdleLockModalProps } from './interfaces';

export const IdleLockModal = ({ isModalOpen }: IdleLockModalProps) => {
    const { userActivity, fetchUserActivity } = useUserActivity();
    const { connect, isConnecting } = useConnectUser();
    const [remaining, setRemaining] = useState<string>('');
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const handleConnect = async () => {
        const result = await connect();

        if (result) {
            notifySuccess({ message: 'Sucesso', description: 'Usuário conectado' });
            fetchUserActivity();
        }
    };

    const handleModalAfterClose = () => {
        setRemaining('');
    };

    useInterval(
        async () => {
            if (!userActivity || (userActivity as { offline: boolean })?.offline) return;

            const uActivity = userActivity as UserActivity;

            const now = Date.now();
            const endTime =
                Number(uActivity.contextLastAcess?.lastAcess || 0) +
                ((uActivity.contextLastAcess?.generalBreakSetting.notificationIntervalSeconds || 0) +
                    (uActivity.contextLastAcess?.generalBreakSetting.breakStartDelaySeconds || 0)) *
                    1000;

            const diffMs = endTime - now;
            const absDiff = Math.abs(diffMs);
            const hours = Math.floor(absDiff / 3600000);
            const minutes = Math.floor((absDiff % 3600000) / 60000);
            const seconds = Math.floor((absDiff % 60000) / 1000);

            const formatted =
                diffMs > 0
                    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
                          2,
                          '0'
                      )}`
                    : '00:00:00';

            setRemaining(formatted);

            if (diffMs <= 0 && seconds === 0) {
                setIsCheckingStatus(true);
            }

            if (diffMs < 0 && seconds === 5) {
                await fetchUserActivity();
                setIsCheckingStatus(false);
            }
        },
        isModalOpen ? 1000 : 0
    );

    return (
        <Modal
            title='Você ainda está ai?'
            closable={false}
            keyboard={false}
            maskClosable={false}
            open={isModalOpen}
            okText='Estou aqui'
            onOk={handleConnect}
            okButtonProps={{
                loading: isConnecting,
                disabled: isCheckingStatus,
                className: 'antd-span-default-color',
            }}
            cancelButtonProps={{ style: { display: 'none' } }}
            afterClose={handleModalAfterClose}
        >
            <Spin spinning={isCheckingStatus} tip='Verificando status...'>
                <Row justify='center' align='middle' gutter={[16, 16]}>
                    <Col span={24}>
                        <Alert
                            message='Você ficou um tempo sem executar nenhuma atividade, a pausa automática será iniciada quando o contador chegar ao fim.'
                            type='warning'
                        />
                    </Col>
                    <Col>
                        <Typography.Text
                            strong
                            style={{
                                fontSize: 32,
                                color: 'inherit',
                            }}
                        >
                            {remaining}
                        </Typography.Text>
                    </Col>
                </Row>
            </Spin>
        </Modal>
    );
};
