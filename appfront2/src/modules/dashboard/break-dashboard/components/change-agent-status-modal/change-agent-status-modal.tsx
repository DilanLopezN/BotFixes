import { Col, Modal, Row, Typography } from 'antd';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useChangeAgentStatus } from '../../hooks/use-change-agent-status';
import type { ChangeAgentStatusModalProps } from './interfaces';

export const ChangeAgentStatusModal = ({
  isOpen,
  selectedBreak,
  selectedAgentIds,
  onClose,
  fetchAgentStatusList,
  setSelectedAgentIds,
  setSelectedBreak,
}: ChangeAgentStatusModalProps) => {
  const { changeMultipleAgentStatus, isChangingAgentStatus } = useChangeAgentStatus();

  const handleConnect = async () => {
    const result = await changeMultipleAgentStatus({
      userIds: selectedAgentIds || [],
      breakSettingId: selectedBreak?.value,
    });

    if (result) {
      notifySuccess({ message: 'Sucesso', description: 'O status dos agentes foram alterado' });
      setSelectedAgentIds([]);
      setSelectedBreak(undefined);
      fetchAgentStatusList();
      onClose();
      return;
    }

    notifyError('Erro ao alterar status dos agentes selecionados');
  };

  return (
    <Modal
      title='Alterar status dos agentes'
      closable={false}
      keyboard={false}
      maskClosable={false}
      open={isOpen}
      okText='Alterar status'
      cancelText='Cancelar'
      onOk={handleConnect}
      onCancel={onClose}
      okButtonProps={{
        loading: isChangingAgentStatus,
      }}
      cancelButtonProps={{ disabled: isChangingAgentStatus }}
    >
      <Row gutter={[16, 16]}>
        <Col>
          <Typography.Text>
            Deseja alterar o status dos <b>{(selectedAgentIds || []).length} agentes</b>{' '}
            selecionados para <b>{selectedBreak?.label}</b>?
          </Typography.Text>
        </Col>
      </Row>
    </Modal>
  );
};
