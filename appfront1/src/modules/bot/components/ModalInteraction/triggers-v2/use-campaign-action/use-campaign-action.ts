import { useState } from 'react';
import { BotService } from '../../../../services/BotService';
import { DataActionProps, UseCampaignActionProps, UseCampaignActionResult } from './interfaces';

export const useCampaignAction = ({ workspaceId, action }: UseCampaignActionProps): UseCampaignActionResult => {
    const [loading, setLoading] = useState(false);

    const executeAction = async (name: string) => {
        setLoading(true);

        try {
            const data: DataActionProps = { action, name };
            await BotService.campaignAction(workspaceId, data);
        } catch (err: any) {
        } finally {
            setLoading(false);
        }
    };

    return { executeAction, loading };
};
