import { CoffeeOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '~/hooks/use-auth';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import { BreakModal } from './break-modal';
import { DisconnectModal } from './disconnect-modal';
import { StartBreakButtonContainer } from './styles';

export const StartBreakModal = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data: workspaceList } = useWorkspaceList();
  const { user } = useAuth();
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  const selectedWorkspace = workspaceList?.data?.find((workspace) => workspace._id === workspaceId);

  const isUserAdmin = user
    ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '')
    : false;

  const handleOpenBreakModal = () => {
    setIsBreakModalOpen(true);
  };

  const handleCloseBreakModal = () => {
    setIsBreakModalOpen(false);
  };

  const handleOpenDisconnectModal = () => {
    setIsDisconnectModalOpen(true);
  };

  const handleCloseDisconnectModal = () => {
    setIsDisconnectModalOpen(false);
  };

  const items = [
    {
      key: 'add-break',
      label: 'Registrar pausa',
      icon: <CoffeeOutlined />,
      onClick: handleOpenBreakModal,
    },
    {
      key: 'disconnect',
      label: 'Desconectar',
      icon: <PoweroffOutlined />,
      onClick: handleOpenDisconnectModal,
    },
  ];

  if (
    !selectedWorkspace ||
    isUserAdmin ||
    !selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus ||
    !selectedWorkspace?.generalConfigs?.enableAgentStatusForAgents
  ) {
    return null;
  }

  return (
    <>
      <Dropdown
        menu={{
          items,
        }}
        trigger={['hover']}
        placement='topRight'
      >
        <StartBreakButtonContainer>
          <PoweroffOutlined />
        </StartBreakButtonContainer>
      </Dropdown>
      <BreakModal isVisible={isBreakModalOpen} onClose={handleCloseBreakModal} />
      <DisconnectModal isVisible={isDisconnectModalOpen} onClose={handleCloseDisconnectModal} />
    </>
  );
};
