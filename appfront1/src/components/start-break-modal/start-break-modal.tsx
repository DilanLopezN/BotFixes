import { CoffeeOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../utils/UserPermission';
import { BreakModal } from './break-modal';
import { DisconnectModal } from './disconnect-modal';
import { StartBreakButtonContainer } from './styles';

export const StartBreakModal = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const user = useSelector((state: any) => state.loginReducer.loggedUser);
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const isUserAdmin = user ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '') : false;

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
                    <PoweroffOutlined className='icon-menu' style={{ color: '#fff' }} />
                </StartBreakButtonContainer>
            </Dropdown>
            <BreakModal isVisible={isBreakModalOpen} onClose={handleCloseBreakModal} />
            <DisconnectModal isVisible={isDisconnectModalOpen} onClose={handleCloseDisconnectModal} />
        </>
    );
};
