import { useState, useEffect } from 'react';
import { AIAgentService, Agent } from '../../../service/AIAgentService';
import { WorkspaceService } from '../../../../workspace/services/WorkspaceService';
import { HealthService } from '../../../../integrations/services/HealthService';
import { Bot } from '../../../../../model/Bot';
import { HealthIntegration } from '../../../../../model/Integrations';
import { addNotification } from '../../../../../utils/AddNotification';

interface UseAgentDataProps {
    selectedWorkspace: any;
    getTranslation: (key: string) => string;
}

export const useAgentData = ({ selectedWorkspace, getTranslation }: UseAgentDataProps) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [bots, setBots] = useState<Bot[]>([]);
    const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);

    const loadAgents = async () => {
        if (!selectedWorkspace?._id) return;

        setLoading(true);
        try {
            const response = await AIAgentService.listAgents(selectedWorkspace._id, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar agentes'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            setAgents(response || []);
        } catch (error) {
            console.error('Error loading agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBots = async () => {
        if (!selectedWorkspace?._id) return;

        try {
            const response = await WorkspaceService.getWorkspaceBots(selectedWorkspace._id);
            setBots(response?.data || []);
        } catch (error) {
            console.error('Error loading bots:', error);
        }
    };

    const loadIntegrations = async () => {
        if (!selectedWorkspace?._id) return;

        try {
            const response = await HealthService.getHealthIntegrations(selectedWorkspace._id);
            setIntegrations(response?.data || []);
        } catch (error) {
            console.error('Error loading integrations:', error);
        }
    };

    const loadAllData = async () => {
        await Promise.all([
            loadAgents(),
            loadBots(),
            loadIntegrations()
        ]);
    };

    useEffect(() => {
        loadAllData();
    }, [selectedWorkspace]);

    return {
        agents,
        loading,
        bots,
        integrations,
        loadAgents,
        loadBots,
        loadIntegrations,
        loadAllData
    };
};
