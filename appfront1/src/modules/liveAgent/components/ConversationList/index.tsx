import { AnimatePresence, motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import { FC, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ConversationCard } from '../';
import { UseWindowEvent } from '../../../../hooks/event.hook';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { onFocusChange } from '../../../../utils/focused';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ConversationCardData } from '../ConversationCard/props';
import { DynamicConversationList } from '../DynamicConversationList';
import { InfinityOptions } from './../Filter/props';
import { ConversationListProps } from './props';
import SkeletonLines from './skeleton';
import './styles.scss';
import { ConversationTabFilter } from 'kissbot-core';
import { useInterval } from '../../../../hooks/use-interval';

const ConversationListComponent = ({
    conversations,
    selectConversation,
    loggedUser,
    loadingMore,
    loadMore,
    appliedFilters,
    workspaceId,
    getTranslation,
    socketConnection,
    canLoadingMoreConversations,
    teams,
    channels,
    onUpdatedConversationSelected,
}: ConversationListProps & I18nProps) => {
    const containerId = 'content-conversations';
    const initialInfinity = {
        limit: 20,
        actual: 0,
    } as InfinityOptions;

    const [conversationsState, setConversationsState] = useState<ConversationCardData[]>(conversations);
    const [infinity, setInfinity] = useState({ ...initialInfinity });
    const [sort, setSort] = useState({
        order: appliedFilters.sort.field,
        direction: appliedFilters.sort.direction,
    });
    const [tab, setTab] = useState(appliedFilters.tab);
    const [focused, setFocused] = useState(true);

    const loadingMoreRef: any = useRef(null);
    loadingMoreRef.current = { loadingMore };

    useEffect(() => {
        setConversationsState(conversations);
    }, [conversations]);

    useEffect(() => {
        const { field, direction } = appliedFilters.sort;

        setSort({
            order: field,
            direction,
        });
    }, [appliedFilters.sort]);

    const infinityRef = useRef(infinity);

    useEffect(() => {
        startScrolled();
    }, []);

    UseWindowEvent(
        'reloadConversationList',
        () => {
            let focus = document.hasFocus();

            loadMore?.(infinityRef.current, undefined, true, focus);
        },
        []
    );

    useEffect(() => {
        // container já efetua o get inicial após reload, então executar aqui apenas
        // quando página + 1
        if (loadMore && !loadingMore && canLoadingMoreConversations && infinityRef.current.actual > 0) {
            loadMore(infinityRef.current);
        }
    }, [infinity]);

    useEffect(() => {
        if (tab !== appliedFilters.tab) {
            scrollToTop();
        }

        infinityRef.current = { ...initialInfinity };
        setInfinity({ ...initialInfinity });
        setTab(appliedFilters.tab);
    }, [appliedFilters]);

    const onScrolled = () => {
        if (loadingMoreRef.current.loadingMore || !canLoadingMoreConversations) {
            return;
        }

        infinityRef.current = {
            ...infinity,
            actual: infinityRef.current.actual + 1,
        };

        setInfinity(infinityRef.current);
    };

    useEffect(() => {
        loadingMoreRef.current.loadingMore = loadingMore;
        if (loadingMoreRef.current.loadingMore) {
            scrollToEnd();
        }
    }, [loadingMore]);

    const scrollToEnd = () => {
        const content = document.getElementById(containerId);
        if (!content) {
            return;
        }

        content.scrollTop = content.scrollHeight - content.clientHeight;
    };

    const infinityScrollLoadingId = 'infinity-loading';

    const startScrolled = () => {
        document.getElementById(containerId)?.addEventListener(
            'scroll',
            debounce(() => {
                const isScrolledIntoView = (el) => {
                    const rect = el.getBoundingClientRect();
                    const elemTop = rect.top;
                    const elemBottom = rect.bottom - 20;
                    return elemTop >= 0 && elemBottom <= window.innerHeight;
                };
                const el = document.getElementById(infinityScrollLoadingId);
                if (!el) {
                    return;
                }
                isScrolledIntoView(el) && onScrolled();
            }, 200)
        );
    };

    const scrollToTop = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = 0);
    };

    useEffect(() => {
        onFocusChange((focused) => setFocused(focused));
    }, []);

    useInterval(() => {
        if (workspaceId !== '645d54b4c676ac30aa8cf380') return;

        if (![ConversationTabFilter.all, ConversationTabFilter.bot].includes(tab)) {
            loadMore?.({ limit: infinityRef.current?.limit, actual: 0 }, undefined, true, false, true);
        }
    }, 60_000);

    return (
        <DynamicConversationList
            id={containerId}
            className='conversationContainer'
            flex
            bgcolor='#FFF'
            borderRight='1px #e4e4e4 solid'
            overflowY='auto'
            overflowX='hidden'
        >
            {!!loadingMoreRef.current.loadingMore &&
            JSON.stringify(infinityRef.current) === JSON.stringify(initialInfinity) ? (
                <Wrapper>
                    <SkeletonLines />
                </Wrapper>
            ) : conversationsState?.length > 0 ? (
                <div>
                    <AnimatePresence>
                        {orderBy(conversationsState, [...sort.order], [...sort.direction])
                            .filter((conversation) => !!conversation._id)
                            .map((conversation) => (
                                <motion.div
                                    key={conversation._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                >
                                    <ConversationCard
                                        onUpdatedConversationSelected={onUpdatedConversationSelected}
                                        teams={teams}
                                        channels={channels}
                                        key={`ConversationCard:${conversation._id}`}
                                        conversation={conversation}
                                        className={`ConversationCard:${conversation._id}`}
                                        loggedUser={loggedUser}
                                        onClick={() => conversation._id && selectConversation(conversation._id)}
                                        socketConnection={socketConnection as Socket}
                                        workspaceId={workspaceId as string}
                                    />
                                </motion.div>
                            ))}
                    </AnimatePresence>
                    <div id={infinityScrollLoadingId} />
                    {loadingMoreRef.current.loadingMore && (
                        <Wrapper flexBox justifyContent='center'>
                            <img style={{ height: '40px' }} src='assets/img/loading.gif' />
                        </Wrapper>
                    )}
                </div>
            ) : (
                <Wrapper padding='20px 40px'>
                    <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
                        <img style={{ height: '150px' }} src='assets/img/empty_draw.svg' />
                    </Wrapper>
                    <Wrapper flexBox textAlign='center' margin='30px 0'>
                        {`${getTranslation("We didn't find any results, please try again")}.`}
                    </Wrapper>
                    <Wrapper flexBox justifyContent='center' margin='50px 20px' />
                </Wrapper>
            )}
        </DynamicConversationList>
    );
};

export const ConversationList = I18n(ConversationListComponent) as FC<ConversationListProps>;
