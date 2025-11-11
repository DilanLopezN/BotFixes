import { useState } from 'react';
import { Modal } from 'antd';
import { useHistory } from 'react-router-dom';
import { AIAgentService, Agent } from '../../../service/AIAgentService';
import { addNotification } from '../../../../../utils/AddNotification';

interface UseAgentActionsProps {
    selectedWorkspace: any;
    getTranslation: (key: string) => string;
    onAgentChange: () => void;
}

export const useAgentActions = ({ 
    selectedWorkspace, 
    getTranslation, 
    onAgentChange
}: UseAgentActionsProps) => {
    const history = useHistory();
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editingInDrawer, setEditingInDrawer] = useState<Agent | null>(null);

    const handleDeleteAgent = async (agentId: string) => {
        if (!selectedWorkspace?._id) return;

        Modal.confirm({
            title: getTranslation('Confirmar exclusão'),
            content: getTranslation('Tem certeza que deseja excluir este agente?'),
            onOk: async () => {
                try {
                    await AIAgentService.deleteAgent(selectedWorkspace._id, agentId, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao excluir agente'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });

                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Agente excluído com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                    
                    onAgentChange();
                } catch (error) {
                    console.error('Error deleting agent:', error);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao excluir agente'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            },
        });
    };

    const handleConfigureAgent = (agentId: string) => {
        if (!agentId) {
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('ID do agente inválido'),
                type: 'danger',
                duration: 3000,
            });
            return;
        }
        history.push(`/settings/ai-agent/${agentId}/configure`);
    };

    const handleViewAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setEditingInDrawer(null);
        setIsDrawerVisible(true);
    };

    const handleEditInDrawer = (agent: Agent) => {
        setEditingInDrawer(agent);
        setSelectedAgent(agent);
        setIsDrawerVisible(true);
    };

    const handleUpdateAgent = async (formik: any) => {
        if (!selectedWorkspace?._id || !editingInDrawer) return;

        try {
            const submitData = {
                ...formik.values,
            };

            await AIAgentService.updateAgent(
                selectedWorkspace._id,
                editingInDrawer.id,
                submitData,
                (err) => {
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao atualizar agente'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Agente atualizado com sucesso'),
                type: 'success',
                duration: 3000,
            });
            
            closeDrawer();
            formik.resetForm();
            onAgentChange();
        } catch (error) {
            console.error('Error updating agent:', error);
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao atualizar agente'),
                type: 'danger',
                duration: 3000,
            });
        }
    };

    const closeDrawer = () => {
        setIsDrawerVisible(false);
        setEditingInDrawer(null);
        setSelectedAgent(null);
    };

    const handleDrawerDelete = (agentId: string) => {
        handleDeleteAgent(agentId);
        setIsDrawerVisible(false);
    };

    return {
        selectedAgent,
        isDrawerVisible,
        editingInDrawer,
        handleDeleteAgent,
        handleConfigureAgent,
        handleViewAgent,
        handleEditInDrawer,
        handleUpdateAgent,
        closeDrawer,
        handleDrawerDelete
    };
};
