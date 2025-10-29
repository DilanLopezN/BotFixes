import { Alert, Col, Form, Input, Modal, Row } from 'antd';
import { useEffect } from 'react';
import { NumberInput } from '~/components/number-input';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useCreateBreak } from '../../hooks/use-create-break';
import { useUpdateBreak } from '../../hooks/use-update-break';
import type { BreakFormValues, BreakModalProps } from './interfaces';

export const BreakModal = ({ selectedBreak, isVisible, onClose, onRefresh }: BreakModalProps) => {
  const [form] = Form.useForm<BreakFormValues>();
  const { createNewBreak, isCreating } = useCreateBreak();
  const { updateBreak, isUpdating } = useUpdateBreak();

  const isLoading = isCreating || isUpdating;

  const handleClose = () => {
    if (isLoading) return;

    onClose();
  };

  const handleModalAfterClose = () => {
    form.resetFields();
  };

  const handleCreateBreak = async (values: BreakFormValues) => {
    const result = await createNewBreak(values);

    if (!result) {
      notifyError('Erro ao criar pausa');
      return;
    }

    notifySuccess({ message: 'Sucesso', description: 'Pausa criada.' });
    onClose();
    onRefresh();
  };

  const handleEditBreak = async (values: BreakFormValues) => {
    if (!selectedBreak) return;

    const result = await updateBreak({ id: selectedBreak.id, ...values });

    if (!result) {
      notifyError('Erro ao editar pausa');
      return;
    }

    notifySuccess({ message: 'Sucesso', description: 'Pausa editada.' });
    onClose();
    onRefresh();
  };

  const handleFinish = (values: BreakFormValues) => {
    if (selectedBreak) {
      handleEditBreak(values);
    } else {
      handleCreateBreak(values);
    }
  };

  useEffect(() => {
    if (selectedBreak) {
      form.setFieldsValue({
        name: selectedBreak.name,
        durationSeconds: selectedBreak.durationSeconds / 60,
      });
    }
  }, [form, selectedBreak]);

  return (
    <Modal
      title='Pausa'
      open={isVisible}
      onCancel={handleClose}
      okText='Salvar'
      cancelText='Cancelar'
      okButtonProps={{ htmlType: 'submit', form: 'break-modal-form', loading: isLoading }}
      cancelButtonProps={{ disabled: isLoading }}
      width={480}
      maskClosable={false}
      keyboard={false}
      afterClose={handleModalAfterClose}
    >
      <Form id='break-modal-form' form={form} layout='vertical' onFinish={handleFinish}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message='Após o término da pausa, o usuário pode exceder o tempo em até 2 horas. Depois disso, será desconectado e ficará offline.'
              type='info'
            />
          </Col>
          <Col span={24}>
            <Form.Item
              name='name'
              label='Nome'
              rules={[
                { required: true, message: 'Campo obrigatório' },
                hasOnlyWhitespaces('Caracteres inválidos'),
                {
                  max: 50,
                  message: 'O nome deve ter no máximo 50 caracteres.',
                },
              ]}
            >
              <Input placeholder='Ex: Almoço' />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name='durationSeconds'
              label='Intervalo (minutos)'
              rules={[
                { required: true, message: 'Campo obrigatório' },
                {
                  type: 'number',
                  max: 480,
                  message: 'O valor máximo permitido é 480 minutos',
                },
              ]}
            >
              <NumberInput placeholder='Ex: 60' />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
