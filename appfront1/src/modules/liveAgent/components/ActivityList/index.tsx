import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActivityListProps } from './props';
import ActivityCard from '../ActivityCard';
import i18n from '../../../i18n/components/i18n';
import debounce  from 'lodash/debounce';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { timeout } from '../../../../utils/Timer';
import { Scroll } from './styled';
import { SkeletonLines } from './skeleton-lines';
import mixpanel from 'mixpanel-browser';

interface ActivitiesFilter {
    search: string | undefined;
    limit: number;
    skip: number;
    origin: string;
}

const ActivityList: FC<ActivityListProps & I18nProps> = ({
    workspaceId,
    onOpenConversation,
    getTranslation,
    appliedTextFilter,
}) => {
    const infinityScrollLoadingId = 'infinity-loading-activities';
    const containerId = 'activities-container';

    const initialFilters = {
        search: appliedTextFilter || undefined,
        limit: 25,
        skip: 0,
        origin: '',
    };

    const [activities, setActivities] = useState<any[]>([]);
    const [infinityFilters, setInfinityFilters] = useState<ActivitiesFilter>(initialFilters);
    const [notLoadingMore, setNotLoadingMore] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [selected, setSelected] = useState('');

    const notLoadingMoreRef: any = useRef(null);
    notLoadingMoreRef.current = { notLoadingMore, setNotLoadingMore };

    const loadingMoreRef: any = useRef(null);
    loadingMoreRef.current = { loadingMore, setLoadingMore };

    useEffect(() => {
        startScrollHandler();
    }, [activities.length > 0 && !loading]);

    useEffect(() => {
        setLoading(true);
        if (appliedTextFilter !== infinityFilters.search) {
            debouncedSearch(appliedTextFilter);
        }
    }, [appliedTextFilter]);

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
                    onScrolled();
                }
            }, 200)
        );
    };

    const onScrolled = () => {
        // não existe mais activities na api
        if (notLoadingMoreRef.current.notLoadingMore) {
            return;
        }

        loadingMoreRef.current.setLoadingMore(true);

        setInfinityFilters((prev) => ({
            ...prev,
            skip: prev.skip + prev.limit,
            origin: 'scroll',
        }));
    };

    const getActivityList = async () => {
        const filtersCopy: any = { ...infinityFilters };

        if (!infinityFilters.search || infinityFilters.search === '') {
            delete filtersCopy.search;
        }

        delete filtersCopy.origin;

        const response = await LiveAgentService.searchActivities(workspaceId, {
            limit: filtersCopy.limit,
            skip: filtersCopy.skip,
            q: filtersCopy.search,
        });

        try {
            mixpanel.track('@transbordo.busca-textual.activities', {
                text: filtersCopy.search,
            });
        } catch (error) {console.error(`mixpanel.track ${JSON.stringify({error})}`)}

        if (
            (!filtersCopy.search && infinityFilters.origin === 'scroll') ||
            (filtersCopy.search && infinityFilters.origin === 'scroll' && filtersCopy.skip > 0)
        ) {
            setActivities((prev) => [...prev, ...(response || [])]);
        } else if (
            (filtersCopy.search && infinityFilters.origin === 'scroll' && filtersCopy.skip === 0) ||
            (filtersCopy.search && infinityFilters.origin === 'search')
        ) {
            scrollToTop();
            setActivities(response ?? []);
        } else {
            setActivities(response ?? []);
        }
        timeout(() => setLoading(false), 100);

        if (loadingMoreRef.current.loadingMore) {
            loadingMoreRef.current.setLoadingMore(false);
        }

        if (response?.length < infinityFilters.limit) {
            notLoadingMoreRef.current.setNotLoadingMore(true);
        }
    };

    useEffect(() => {
        getActivityList();
    }, [infinityFilters]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value) => {
            if (notLoadingMoreRef.current.notLoadingMore) {
                notLoadingMoreRef.current.setNotLoadingMore(false);
            }

            setInfinityFilters({
                ...initialFilters,
                search: value,
                origin: 'search',
            });
        }, 700),
        []
    );

    const scrollToEnd = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = content.scrollHeight - content.clientHeight);
    };

    const scrollToTop = () => {
        const content = document.getElementById(containerId);
        content && (content.scrollTop = 0);
    };

    useEffect(() => {
        if (loadingMoreRef.current.loadingMore) {
            scrollToEnd();
        }
    }, [loadingMoreRef.current.loadingMore]);

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
                    {activities?.length > 0 ? (
                        <Scroll
                            height={`calc(100% - ${!appliedTextFilter ? '130px' : '0px'})`}
                            overflowY='auto'
                            id={containerId}
                        >
                            {activities.map((activity: any) => {
                                return (
                                    <ActivityCard
                                        key={`activityCard:${activity._id}`}
                                        activity={activity}
                                        search={appliedTextFilter ?? ''}
                                        onClick={() => {
                                            setSelected(activity._id);
                                            onOpenConversation(activity.conversationId);
                                            const event = new CustomEvent('scrollActivity', {
                                                detail: {
                                                    conversationId: activity.conversationId,
                                                    activityHash: activity.hash,
                                                },
                                            });
                                            timeout(() => window.dispatchEvent(event), 300);
                                        }}
                                        selected={selected}
                                    />
                                );
                            })}
                            <div id={infinityScrollLoadingId} />
                            {loadingMore && (
                                <Wrapper flexBox justifyContent='center'>
                                    <img style={{ height: '40px' }} src='assets/img/loading.gif' />
                                </Wrapper>
                            )}
                        </Scroll>
                    ) : (
                        <Wrapper padding='20px 40px'>
                            <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
                                <img style={{ height: '150px' }} src='assets/img/empty_draw.svg' />
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

export default i18n(ActivityList) as FC<ActivityListProps>;
