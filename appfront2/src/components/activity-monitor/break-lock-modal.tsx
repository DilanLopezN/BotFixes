import { Alert, Col, Form, Input, Modal, Row, Typography } from 'antd';
import { useState } from 'react';
import { useInterval } from '~/hooks/use-interval';
import { useUserActivity } from '~/hooks/use-user-activity';
import { UserActivity } from '~/interfaces/user-activity';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { notifySuccess } from '~/utils/notify-success';
import { useFinishBreak } from './hooks/use-finish-break';
import type { BreakLockFormValues, BreakLockModalProps } from './interfaces';

export const BreakLockModal = ({ isModalOpen }: BreakLockModalProps) => {
  const { userActivity, fetchUserActivity } = useUserActivity();
  const { finishUserBreak, isFinishingBreak } = useFinishBreak();
  const [form] = Form.useForm<BreakLockFormValues>();
  const [remaining, setRemaining] = useState<string>('');

  const isNegative = remaining.startsWith('-');

  const handleModalAfterClose = () => {
    form.resetFields();
    setRemaining('');
  };

  const handleFinish = async (values: BreakLockFormValues) => {
    const result = await finishUserBreak(values);

    if (result) {
      notifySuccess({ message: 'Sucesso', description: 'Pausa finalizada' });
      fetchUserActivity();
    }
  };

  useInterval(
    () => {
      if (!userActivity || (userActivity as { offline: boolean })?.offline) return;

      const uActivity = userActivity as UserActivity;

      const now = Date.now();
      const endTime = Number(uActivity.startedAt) + (uActivity.contextDurationSeconds || 0) * 1000;

      const diffMs = endTime - now;
      const absDiff = Math.abs(diffMs);
      const hours = Math.floor(absDiff / 3600000);
      const minutes = Math.floor((absDiff % 3600000) / 60000);
      const seconds = Math.floor((absDiff % 60000) / 1000);

      const formatted = `${diffMs < 0 ? '-' : ''}${String(hours).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setRemaining(formatted);
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
        htmlType: 'submit',
        form: 'finish-break-form',
        loading: isFinishingBreak,
      }}
      cancelButtonProps={{ style: { display: 'none' } }}
      afterClose={handleModalAfterClose}
    >
      <Form id='finish-break-form' form={form} layout='vertical' onFinish={handleFinish}>
        <Row justify='center' align='middle' gutter={[16, 16]}>
          <Col>
            <Typography.Text
              strong
              style={{
                fontSize: 32,
                color: isNegative ? '#ff4d4f' : 'inherit',
              }}
            >
              {remaining}
            </Typography.Text>
          </Col>
          {isNegative && (
            <>
              <Col span={24}>
                <Alert
                  message='Você excedeu o tempo da pausa, adicione uma justificativa'
                  type='warning'
                  showIcon
                />
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
            </>
          )}
        </Row>
      </Form>
    </Modal>
  );
};
