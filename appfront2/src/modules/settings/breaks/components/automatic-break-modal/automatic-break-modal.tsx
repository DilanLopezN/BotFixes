import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Flex, Form, Modal, Row, Select, Spin, Switch, Tooltip } from 'antd';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { NumberInput } from '~/components/number-input';
import { Me } from '~/interfaces/me';
import { normalizeText } from '~/utils/normalize-text';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import { useActiveUsers } from '../../hooks/use-active-users';
import { useAutomaticBreakSettings } from '../../hooks/use-automatic-break-settings';
import { useCreateAutomaticBreakSettings } from '../../hooks/use-create-automatic-break-settings';
import { useUpdateAutomaticBreakSettings } from '../../hooks/use-update-automatic-break-settings/use-create-automatic-break-settings';
import type { AutomaticBreakFormValues, AutomaticBreakModalProps } from './interfaces';

export const AutomaticBreakModal = ({ isVisible, onClose }: AutomaticBreakModalProps) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [form] = Form.useForm<AutomaticBreakFormValues>();
  const { createNewAutomaticBreakSettings, isCreating } = useCreateAutomaticBreakSettings();
  const { updateAutoBreakSettings, isUpdating } = useUpdateAutomaticBreakSettings();
  const { automaticBreakSettings, isFetchingAutomaticBreakSettings, fetchAutomaticBreakSettings } =
    useAutomaticBreakSettings();
  const { activeUsers, isLoadingActiveUsers, fetchActiveUsers } = useActiveUsers();

  const isLoading = isCreating || isUpdating;

  const activeUserOptions = useMemo(() => {
    if (!activeUsers) return [];

    const users = activeUsers.data
      .filter((user) => {
        if (isAnySystemAdmin(user as Me) || isWorkspaceAdmin(user as Me, workspaceId)) {
          return false;
        }

        return true;
      })
      .map((user) => {
        return { label: user.name, value: user._id };
      });

    return users;
  }, [activeUsers, workspaceId]);

  const handleClose = () => {
    if (isLoading) return;

    onClose();
  };

  const handleModalAfterClose = () => {
    form.resetFields();
  };

  const handleCreateBreak = async (values: AutomaticBreakFormValues) => {
    const result = await createNewAutomaticBreakSettings(values);

    if (!result) {
      notifyError('Erro ao salvar configurações');
      return;
    }

    notifySuccess({ message: 'Sucesso', description: 'Configurações salvas.' });
    onClose();
  };

  const handleEditBreak = async (values: AutomaticBreakFormValues) => {
    if (!automaticBreakSettings) return;

    const result = await updateAutoBreakSettings({ ...values });

    if (!result) {
      notifyError('Erro ao salvar configurações');
      return;
    }

    notifySuccess({ message: 'Sucesso', description: 'Configurações salvas.' });
    onClose();
  };

  const handleFinish = (values: AutomaticBreakFormValues) => {
    if (automaticBreakSettings) {
      handleEditBreak(values);
    } else {
      handleCreateBreak(values);
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    fetchAutomaticBreakSettings();
  }, [fetchAutomaticBreakSettings, isVisible]);

  useEffect(() => {
    if (automaticBreakSettings) {
      form.setFieldsValue({
        enabled: automaticBreakSettings.enabled,
        notificationIntervalSeconds: automaticBreakSettings.notificationIntervalSeconds / 60,
        breakStartDelaySeconds: automaticBreakSettings.breakStartDelaySeconds / 60,
        maxInactiveDurationSeconds: automaticBreakSettings.maxInactiveDurationSeconds / 60,
        excludedUserIds: automaticBreakSettings.excludedUserIds,
      });
      return;
    }

    form.setFieldsValue({
      enabled: false,
      notificationIntervalSeconds: 10,
      breakStartDelaySeconds: 10,
      maxInactiveDurationSeconds: 60,
    });
  }, [form, automaticBreakSettings]);

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  return (
    <Modal
      title='Configurar pausa automática'
      open={isVisible}
      onCancel={handleClose}
      okText='Salvar'
      cancelText='Cancelar'
      okButtonProps={{ htmlType: 'submit', form: 'automatic-break-modal-form', loading: isLoading }}
      cancelButtonProps={{ disabled: isLoading }}
      width={500}
      maskClosable={false}
      keyboard={false}
      afterClose={handleModalAfterClose}
    >
      <Spin spinning={isFetchingAutomaticBreakSettings}>
        <Form id='automatic-break-modal-form' form={form} layout='vertical' onFinish={handleFinish}>
          <Row>
            <Col span={24}>
              <Form.Item
                name='notificationIntervalSeconds'
                label={
                  <Flex gap={8} align='center'>
                    <span>Intervalo sem interação (minutos)</span>
                    <Tooltip title='Após esse período de inatividade, exibiremos uma notificação para confirmar se o usuário ainda está ativo.'>
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                    </Tooltip>
                  </Flex>
                }
                rules={[
                  { required: true, message: 'Campo obrigatório' },
                  {
                    type: 'number',
                    max: 160,
                    message: 'O valor máximo permitido é 160 minutos',
                  },
                  {
                    type: 'number',
                    min: 2,
                    message: 'O valor mínimo permitido é 2 minutos',
                  },
                ]}
              >
                <NumberInput placeholder='Ex: 10' />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='breakStartDelaySeconds'
                label={
                  <Flex gap={8} align='center'>
                    <span>Intervalo para ativar a pausa automática (minutos)</span>
                    <Tooltip title='Se o agente não interagir dentro deste intervalo após a notificação, a pausa automática será iniciada.'>
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                    </Tooltip>
                  </Flex>
                }
                rules={[
                  { required: true, message: 'Campo obrigatório' },
                  {
                    type: 'number',
                    max: 160,
                    message: 'O valor máximo permitido é 160 minutos',
                  },
                  {
                    type: 'number',
                    min: 2,
                    message: 'O valor mínimo permitido é 2 minutos',
                  },
                ]}
              >
                <NumberInput placeholder='Ex: 10' />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='maxInactiveDurationSeconds'
                label={
                  <Flex gap={8} align='center'>
                    <span>Duração da pausa automática (minutos)</span>
                    <Tooltip title='Tempo máximo que o agente pode permanecer em pausa automática. Após esse período, ele será desconectado e ficará offline.'>
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                    </Tooltip>
                  </Flex>
                }
                rules={[
                  { required: true, message: 'Campo obrigatório' },
                  {
                    type: 'number',
                    max: 160,
                    message: 'O valor máximo permitido é 160 minutos',
                  },
                  {
                    type: 'number',
                    min: 2,
                    message: 'O valor mínimo permitido é 2 minutos',
                  },
                ]}
              >
                <NumberInput placeholder='Ex: 20' />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='excludedUserIds'
                label={
                  <Flex gap={8} align='center'>
                    <span>Restringir regra para os usuários</span>
                    <Tooltip title='Os usuários selecionados não entrarão em pausa automática por inatividade, independentemente do tempo configurado'>
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                    </Tooltip>
                  </Flex>
                }
              >
                <Select
                  allowClear
                  mode='multiple'
                  loading={isLoadingActiveUsers}
                  options={activeUserOptions}
                  placeholder='Selecione os usuários'
                  showSearch
                  autoClearSearchValue={false}
                  filterOption={(search, option) => {
                    return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='enabled'
                valuePropName='checked'
                label={
                  <Flex gap={8} align='center'>
                    <span>Habilitar pausa automática</span>
                  </Flex>
                }
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};
