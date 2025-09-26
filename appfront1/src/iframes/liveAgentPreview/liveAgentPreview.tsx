import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatContainer } from '../../modules/liveAgent/components';
import { LiveAgentService } from '../../modules/liveAgent/service/LiveAgent.service';
import { Spin } from 'antd';

export const LiveAgentPreview: FC<any> = () => {
    const { search } = useLocation();
    const queryParams = useMemo(() => new URLSearchParams(search), [search]);
    const userId = queryParams.get('userId') || undefined;
    const conversationId = queryParams.get('conversationId') || undefined;
    const workspaceId = queryParams.get('workspaceId') || undefined;
    const [conversation, setConversation] = useState<any>();
    const [isLoadingConversatrion, setIsLoadingConversation] = useState(true);

    const loggedUser: any = useMemo(() => (userId ? { _id: userId, roles: [] } : undefined), [userId]);

    const getConversation = useCallback(async () => {
        if (!workspaceId || !conversationId || !loggedUser) {
            return;
        }
        setIsLoadingConversation(true);
        const selectedConversation = await LiveAgentService.getUniqueConversation(conversationId, workspaceId);

        if (!selectedConversation) return;

        const tranformedConversation =
            LiveAgentService.transformConversations([selectedConversation], loggedUser) || {};

        const data = tranformedConversation[selectedConversation._id];
        setConversation(data);
        setIsLoadingConversation(false);
    }, [conversationId, loggedUser, workspaceId]);

    useEffect(() => {
        getConversation();
    }, [getConversation]);

    return (
        <Spin spinning={isLoadingConversatrion}>
            <div style={{ height: '100vh', width: '100%' }}>
                {conversation?._id && (
                    <ChatContainer
                        teams={[]}
                        socketConnection={undefined}
                        notification={() => {}}
                        loggedUser={loggedUser}
                        workspaceId={workspaceId}
                        readingMode={true}
                        conversation={conversation}
                        channelList={[]}
                        onUpdatedConversationSelected={setConversation}
                    />
                )}
            </div>
        </Spin>
    );
};
