import { useState } from 'react';
import { LiveAgentService } from '../../../../../service/LiveAgent.service';
import { UseRemoveMemberProps } from './props';

const useRemoveMember = ({ workspaceId, conversationId }: UseRemoveMemberProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const adminRemoveMember = async (memberId: string) => {
        setLoading(true);
        setError(null);
        try {
            await LiveAgentService.adminRemoveMemberFromConversation(workspaceId, conversationId, memberId, (err) => {
                if (err) {
                    setError(err.message);
                }
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        adminRemoveMember,
    };
};

export { useRemoveMember };
