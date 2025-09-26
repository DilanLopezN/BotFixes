import { Button } from 'antd';
import orderBy from 'lodash/orderBy';
import { FC, useCallback, useEffect, useState } from 'react';
import SkeletonLines from '../../../../../../shared/skeleton-lines';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { LiveAgentService } from '../../../../service/LiveAgent.service';
import ConversationCardResume from '../ConversationCardResume';
import { ContactHistoryItemsProps } from './props';

interface FilterPagination {
    skip: number;
    count: number;
}
interface ConversationResume {
    _id: string;
    createdAt: number;
    tags: any[];
    state: string;
    createdbyChannel: string;
    iid: number;
}

const ContactHistoryItems: FC<ContactHistoryItemsProps> = ({
    contact,
    onSelectConversation,
    conversation,
    workspaceId,
    getTranslation,
}) => {
    const [conversationList, setConversations] = useState<ConversationResume[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterPagination>({ count: 0, skip: 0 });

    const getHistoryConversation = useCallback(async (skip: number) => {
        if (!workspaceId || !contact || contact._id === undefined) return;
        if (contact.conversations && contact.conversations.length === 0) {
            return;
        }
        setLoading(true);
        const historyConversation = await LiveAgentService.getHistoryConversation(
            contact._id,
            workspaceId as string,
            skip
        );

        if (historyConversation) {
            setFilter({ count: historyConversation?.count || 0, skip: skip });
            if (skip) {
                setConversations((currentState) => [...currentState, ...historyConversation.data] || []);
            } else {

                setConversations(historyConversation.data || []);
            }
        }
        setLoading(false);
    }, [contact, workspaceId]);

    const onSelectedConversation = async (conversationId: string) => {
        if (!workspaceId) return;
        onSelectConversation(conversationId);
    };

    useEffect(() => {
        getHistoryConversation(0);
    }, [getHistoryConversation]);

    return (
        <Wrapper>
            <Wrapper>
                {conversationList?.length > 0 &&
                    orderBy(conversationList, 'createdAt', 'desc').map((conversationCurr) => {
                        return (
                            <>
                                <ConversationCardResume
                                    onViewClick={(conversationId: string) => onSelectedConversation(conversationId)}
                                    key={conversationCurr._id}
                                    selectedConversation={conversation}
                                    conversation={conversationCurr}
                                />
                            </>
                        );
                    })}
                {loading && (
                    <SkeletonLines
                        rows={3}
                        size={3}
                        style={{
                            padding: '8px 15px',
                            borderBottom: '1px solid #f0f0f0',
                            margin: '10px 0',
                            height: '95px',
                        }}
                    />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {conversationList?.length < filter.count && !loading && (
                        <Button
                            type='primary'
                            className='antd-span-default-color'
                            onClick={() => getHistoryConversation(filter.skip + 20)}
                        >
                            {getTranslation('Loadmore')}
                        </Button>
                    )}
                </div>
            </Wrapper>
        </Wrapper>
    );
};

export default ContactHistoryItems;
