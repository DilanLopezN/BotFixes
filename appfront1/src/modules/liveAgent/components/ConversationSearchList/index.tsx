import { useEffect, useRef, useState, FC } from 'react';
import { ConversationSearchListProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import orderBy from 'lodash/orderBy';
import debounce from 'lodash/debounce';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import SkeletonLines from './skeleton';
import { ConversationSearchQueryParams, LiveAgentService } from '../../service/LiveAgent.service';
import { ConversationSearchResult } from '../../interfaces/conversation.interface';
import ConversationSearchCard from './components/conversation-search-card';
import { timeout } from '../../../../utils/Timer';
import { Scroll } from './styled';
import mixpanel from 'mixpanel-browser';

const ConversationSearchList = ({
    appliedTextFilter,
    appliedFilters,
    workspaceId,
    getTranslation,
    selectConversation,
    loggedUser,
    teams,
}: ConversationSearchListProps & I18nProps) => {
    const containerId = 'content-conversation-search';
    const initialInfinity: Omit<ConversationSearchQueryParams, 'term'> = {
        limit: 20,
        skip: 0,
    };

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [notLoadingMore, setNotLoadingMore] = useState<boolean>(false);
    const [conversations, setConversations] = useState<ConversationSearchResult[]>([]);
    const [infinity, setInfinity] = useState({ ...initialInfinity });
    const [selectedResult, setSelectedResult] = useState<string | undefined>();

    const [contentYPosition, setContentYPosition] = useState(0);

    const loadingMoreRef: any = useRef(null);
    loadingMoreRef.current = { loadingMore, setLoadingMore };

    const notLoadingMoreRef: any = useRef(null);
    notLoadingMoreRef.current = { notLoadingMore, setNotLoadingMore };

    const getConversations = async (currInfinity?: Omit<ConversationSearchQueryParams, 'term'>, append?: boolean) => {
        const response = await LiveAgentService.searchConversationList(
            workspaceId,
            {
                ...(currInfinity ?? infinity),
                term: appliedTextFilter,
            },
            appliedFilters
        );

        try {
            mixpanel.track('@transbordo.busca-textual.conversations', {
                text: appliedTextFilter,
            });
        } catch (error) {console.error(`mixpanel.track ${JSON.stringify({error})}`)}

        if (append) {
            setConversations((prevState) => [...prevState, ...(response?.data ?? [])]);
            scrollToPosition();
        } else if (append && infinity.skip === 0) {
            scrollToTop();
            setConversations([...(response?.data ?? [])]);
        } else {
            setConversations([...(response?.data ?? [])]);
        }

        timeout(() => setLoading(false), 100);

        if (loadingMoreRef.current.loadingMore) {
            loadingMoreRef.current.setLoadingMore(false);
        }

        if (response?.data?.length < infinity.limit) {
            notLoadingMoreRef.current.setNotLoadingMore(true);
        }
    };

    const onScrolled = () => {
        if (notLoadingMoreRef.current.notLoadingMore) {
            return;
        }

        loadingMoreRef.current.setLoadingMore(true);
        setInfinity((prev) => ({
            ...prev,
            skip: prev.skip + prev.limit,
        }));
    };

    useEffect(() => {
        startScrollHandler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations.length && !loading]);

    const getConversationByIId = async (iid: string) => {
        iid = iid.replace('#', '');
        const response = await LiveAgentService.getConversationList(`iid=${iid}`, workspaceId);

        if (!response?.data?.length) {
            setConversations([]);
            timeout(() => setLoading(false), 200);
            return;
        }

        const [conversation] = response?.data;

        if (conversation) {
            // virtual result search
            setConversations([
                {
                    conversationId: conversation._id,
                    conversation,
                    dataType: 3,
                    id: '1',
                    refId: conversation._id,
                    workspaceId,
                    timestamp: +new Date(conversation.createdAt),
                },
            ]);
            timeout(() => setLoading(false), 100);
        }
    };

    useEffect(() => {
        setLoading(true);

        if (appliedTextFilter.startsWith('#')) {
            const validIid = appliedTextFilter?.trim()?.replace('#', '')?.replace(/\D/g, '');

            if (validIid) {
                getConversationByIId(validIid);
                return;
            }

            return setLoading(false);
        }

        notLoadingMoreRef.current.setNotLoadingMore(false);
        setInfinity({ ...initialInfinity });
        getConversations(initialInfinity);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, appliedTextFilter]);

    useEffect(() => {
        if (infinity.skip > 0) {
            loadingMoreRef.current.setLoadingMore(true);
            getConversations(undefined, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infinity]);

    useEffect(() => {
        if (loadingMoreRef.current.loadingMore) {
            scrollToEnd();
        }
    }, [loadingMoreRef.current.loadingMore]);

    const scrollToEnd = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = content.scrollHeight - content.clientHeight);
    };

    const scrollToTop = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = 0);
    };

    const scrollToPosition = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = contentYPosition);
    };

    const infinityScrollLoadingId = 'infinity-loading-search';

    const startScrollHandler = async () => {
        document.getElementById(containerId)?.addEventListener(
            'scroll',
            debounce(() => {
                const isScrolledIntoView = (el) => {
                    const rect = el.getBoundingClientRect();
                    const elemTop = rect.top;
                    const elemBottom = rect.bottom - 10;
                    return elemTop >= 0 && elemBottom <= window.innerHeight;
                };

                const element = document.getElementById(infinityScrollLoadingId);
                if (!element) {
                    return;
                }

                const isVisible = isScrolledIntoView(element);
                if (isVisible && !loadingMoreRef.current.loadingMore && !notLoadingMoreRef.current.notLoadingMore) {
                    const content = document.getElementById(containerId);
                    content && setContentYPosition(content.scrollTop);
                    onScrolled();
                }
            }, 200)
        );
    };

    const handleSelectConversation = (resultSearchId: string, conversationId: string) => {
        setSelectedResult(resultSearchId);
        selectConversation(conversationId);
    };

    return (
        <Wrapper
            flexBox
            padding='0'
            height='100%'
            flexDirection='column'
            overflowY='hidden !important'
            overflowX='hidden !important'
        >
            {loading ? (
                <SkeletonLines />
            ) : (
                <>
                    {conversations?.length > 0 ? (
                        <Scroll
                            height={`calc(100% - ${!appliedTextFilter ? '130px' : '0px'})`}
                            overflowY='auto'
                            id={containerId}
                        >
                            {orderBy(conversations, 'timestamp', 'desc').map((result) => (
                                <ConversationSearchCard
                                    key={result.id}
                                    onSelectConversation={handleSelectConversation}
                                    conversationResult={result}
                                    selected={result.id === selectedResult}
                                    loggedUser={loggedUser}
                                    workspaceId={workspaceId}
                                    teams={teams}
                                />
                            ))}
                            <div id={infinityScrollLoadingId} />
                            {loadingMore && (
                                <Wrapper flexBox justifyContent='center'>
                                    <img alt='Loading' style={{ height: '40px' }} src='assets/img/loading.gif' />
                                </Wrapper>
                            )}
                        </Scroll>
                    ) : (
                        <Wrapper padding='20px 40px'>
                            <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
                                <img alt='Empty' style={{ height: '150px' }} src='assets/img/empty_draw.svg' />
                            </Wrapper>
                            <Wrapper flexBox textAlign='center' margin='30px 0'>
                                {`${getTranslation("We didn't find any results, please try again with another term")}.`}
                            </Wrapper>
                            <Wrapper flexBox justifyContent='center' margin='50px 20px' />
                        </Wrapper>
                    )}
                </>
            )}
        </Wrapper>
    );
};

export default I18n(ConversationSearchList) as FC<ConversationSearchListProps>;
