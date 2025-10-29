import { Alert, Col, Form, Input, Modal, Row, Spin, Typography } from 'antd';
import { useState } from 'react';
import { useInterval } from '~/hooks/use-interval';
import { useUserActivity } from '~/hooks/use-user-activity';
import { UserActivity } from '~/interfaces/user-activity';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { notifySuccess } from '~/utils/notify-success';
import { useFinishBreak } from './hooks/use-finish-break';
import type { AutomaticBreakLockFormValues, AutomaticBreakLockModalProps } from './interfaces';

export const InAutomaticBreakModal = ({ isModalOpen }: AutomaticBreakLockModalProps) => {
  const [form] = Form.useForm<AutomaticBreakLockFormValues>();
  const { userActivity, fetchUserActivity } = useUserActivity();
  const { finishUserBreak, isFinishingBreak } = useFinishBreak();
  const [remaining, setRemaining] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const handleModalAfterClose = () => {
    form.resetFields();
    setRemaining('');
  };

  const handleFinish = async (values: AutomaticBreakLockFormValues) => {
    const result = await finishUserBreak(values);

    if (result) {
      notifySuccess({ message: 'Sucesso', description: 'Pausa finalizada' });
      fetchUserActivity();
    }
  };

  useInterval(
    async () => {
      if (!userActivity || (userActivity as { offline: boolean })?.offline) return;

      const uActivity = userActivity as UserActivity;

      const now = Date.now();
      const endTime =
        Number(uActivity.startedAt) + (uActivity.contextMaxInactiveDurationSeconds || 0) * 1000;

      const diffMs = endTime - now;
      const absDiff = Math.abs(diffMs);
      const hours = Math.floor(absDiff / 3600000);
      const minutes = Math.floor((absDiff % 3600000) / 60000);
      const seconds = Math.floor((absDiff % 60000) / 1000);

      const formatted =
        diffMs > 0
          ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
              seconds
            ).padStart(2, '0')}`
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
      title='Expediente pausado'
      closable={false}
      keyboard={false}
      maskClosable={false}
      open={isModalOpen}
      okText='Finalizar pausa'
      okButtonProps={{
        form: 'automatic-break-form',
        htmlType: 'submit',
        disabled: isCheckingStatus,
        loading: isFinishingBreak,
      }}
      cancelButtonProps={{ style: { display: 'none' } }}
      afterClose={handleModalAfterClose}
    >
      <Spin spinning={isCheckingStatus} tip='Verificando status...'>
        <Form id='automatic-break-form' form={form} layout='vertical' onFinish={handleFinish}>
          <Row justify='center' align='middle' gutter={[16, 16]}>
            <Col span={24}>
              <Alert
                message='Você foi colocado no modo de pausa automática por inatividade. Quando o contador abaixo chegar ao fim, você será desconectado do sistema.'
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
            <Col span={24}>
              <Form.Item
                name='justification'
                label='Justificativa'
                rules={[
                  { required: true, message: 'Campo obrigatório' },
                  hasOnlyWhitespaces('Caracteres inválidos'),
                  { max: 256, message: 'A justificativa deve ter no máximo 256 caracteres' },
                ]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  placeholder='Justifique o motivo da pausa'
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};
