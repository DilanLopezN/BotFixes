import { useState, useEffect, useRef, FC, useCallback } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { ContactListProps } from './props';
import { ContactSearchResult } from '../../../../interfaces/contact.interface';
import ContactCard from '../../../ContactCard';
import i18n from '../../../../../i18n/components/i18n';
import CommonFilter from '../../../CommonFilter';
import debounce from 'lodash/debounce';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { timeout } from '../../../../../../utils/Timer';
import { Scroll } from './styled';
import { ContactService } from '../../../../service/Contact.service';
import { SkeletonLines } from './skeleton-lines';
import { Tag, Tooltip } from 'antd';
import mixpanel from 'mixpanel-browser';

interface ContactFilters {
    search: string | undefined;
    limit: number;
    skip: number;
    origin: string;
    blocked?: boolean;
}

const ContactList: FC<ContactListProps & I18nProps> = ({
    workspaceId,
    onContactSelected,
    onContactInfo,
    getTranslation,
    appliedTextFilter,
}) => {
    const infinityScrollLoadingId = 'infinity-loading-contacts';
    const containerId = 'contacts-container';

    const initialFilters = {
        search: appliedTextFilter || undefined,
        limit: 20,
        skip: 0,
        origin: '',
    };

    const [contacts, setContacts] = useState<ContactSearchResult[]>([]);
    const [infinityFilters, setInfinityFilters] = useState<ContactFilters>(initialFilters);
    const [notLoadingMore, setNotLoadingMore] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const notLoadingMoreRef: any = useRef(null);
    notLoadingMoreRef.current = { notLoadingMore, setNotLoadingMore };

    const loadingMoreRef: any = useRef(null);
    loadingMoreRef.current = { loadingMore, setLoadingMore };

    useEffect(() => {
        startScrollHandler();
    }, [contacts.length > 0 && !loading]);

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
                    const elemBottom = rect.bottom - 40;
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
        // não existe mais contatos na api
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

    const getContactList = async () => {
        const filtersCopy: any = { ...infinityFilters };
        let filter = {
            term: filtersCopy.search,
            limit: filtersCopy.limit,
            skip: filtersCopy.skip,
            sort: '+name',
            blocked: filtersCopy.blocked,
        };

        if (!infinityFilters.search || infinityFilters.search === '') {
            delete filtersCopy.search;
            delete filter.term;
        }

        if (!filtersCopy.blocked) {
            delete filter.blocked;
        } else {
            delete filter.term;
        }

        if (!filter?.blocked && (!filter.term || filter.term.length < 4)) {
            setContacts([]);
            setLoading(false);
            return;
        }

        delete filtersCopy.origin;

        const response = await ContactService.searchContactList(workspaceId, filter);

        try {
            mixpanel.track('@transbordo.busca-textual.contacts', {
                text: filter.term,
            });
        } catch (error) {console.error(`mixpanel.track ${JSON.stringify({error})}`)}

        if (
            (!filtersCopy.search && infinityFilters.origin === 'scroll') ||
            (filtersCopy.search && infinityFilters.origin === 'scroll' && filtersCopy.skip > 0)
        ) {
            setContacts((prev) => [...prev, ...(response?.data || [])]);
        } else if (
            (filtersCopy.search && infinityFilters.origin === 'scroll' && filtersCopy.skip === 0) ||
            (filtersCopy.search && infinityFilters.origin === 'search')
        ) {
            scrollToTop();
            setContacts(response?.data || []);
        } else {
            setContacts(response?.data || []);
        }
        timeout(() => setLoading(false), 100);

        if (loadingMoreRef.current.loadingMore) {
            loadingMoreRef.current.setLoadingMore(false);
        }

        if (response?.data?.length < infinityFilters.limit) {
            notLoadingMoreRef.current.setNotLoadingMore(true);
        }
    };

    useEffect(() => {
        if (infinityFilters === initialFilters && !appliedTextFilter) {
            setLoading(false);
            return;
        }

        getContactList();
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
        }, 500),
        []
    );

    const onSearch = (search: string) => {
        if (infinityFilters.blocked) {
            return;
        } 
        if (search === '') {
            setInfinityFilters({
                ...initialFilters,
                search: '',
                origin: 'search',
            });
            return;
        } 
        if (search.length < 4) {
            setLoading(false)
            return;
        }
        setLoading(true);
        debouncedSearch(search);
    };

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
            {!appliedTextFilter && (
                <Wrapper
                    bgcolor='#f8f8f8'
                    borderBottom='1px #e8e8e8 solid'
                    borderTop='1px #e8e8e8 solid'
                    // height='85px'
                    padding='6px 5px'
                >
                    <CommonFilter
                        key={infinityFilters.blocked ? 'inputBlocked' : ''}
                        autofocus
                        placeholder={getTranslation('Search contacts')}
                        onChange={(value) => onSearch(value)}
                        initialValue={infinityFilters.search}
                        disabled={infinityFilters.blocked}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip
                            placement='bottom'
                            title={getTranslation(
                                !infinityFilters?.blocked ? 'Filter blocked contacts' : 'Remove filter'
                            )}
                        >
                            <Tag
                                style={{
                                    cursor: 'pointer',
                                    margin: '5px 0 0 0',
                                    color: !infinityFilters?.blocked ? '#696969' : '',
                                }}
                                color={infinityFilters?.blocked ? 'green' : ''}
                                onClick={() => {
                                    setLoading(true);
                                    setInfinityFilters((prevState) => ({
                                        ...prevState,
                                        blocked: !prevState?.blocked,
                                        search: prevState.blocked ? undefined : prevState.search,
                                    }))
                                }}
                            >
                                {getTranslation('Blocked')}
                            </Tag>
                        </Tooltip>
                    </div>
                </Wrapper>
            )}
            {loading ? (
                <SkeletonLines />
            ) : (
                <>
                    {contacts?.length > 0 ? (
                        <Scroll
                            height={`calc(100% - ${!appliedTextFilter ? '130px' : '0px'})`}
                            overflowY='auto'
                            id={containerId}
                        >
                            {contacts.map((contact) => {
                                return (
                                    <ContactCard
                                        key={`contactCard:${contact.refId}`}
                                        contact={contact}
                                        contactSelected={false}
                                        setContactSelected={() => {
                                            onContactSelected(contact.refId);
                                            onContactInfo();
                                        }}
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
                                {(!infinityFilters.search || infinityFilters.search?.length < 4) && !infinityFilters?.blocked ? (
                                    <img style={{ height: '210px' }} src={'assets/img/search-contact.svg'} />
                                ) : (
                                    <img style={{ height: '150px' }} src={'assets/img/empty_draw.svg'} />
                                )}
                            </Wrapper>
                            <Wrapper flexBox textAlign='center' margin='30px 0'>
                                {(!infinityFilters.search || infinityFilters.search?.length < 4) && !infinityFilters?.blocked
                                    ? getTranslation(
                                          'Type at least 4 characters to search by contact or click blocked!'
                                      )
                                    : infinityFilters.blocked
                                    ? getTranslation("We didn't find any blocked contacts!")
                                    : `${getTranslation(
                                          "We didn't find any results, please try again with another term"
                                      )}.`}
                            </Wrapper>
                            <Wrapper flexBox justifyContent='center' margin='50px 20px' />
                        </Wrapper>
                    )}
                </>
            )}
        </Wrapper>
    );
};

export default i18n(ContactList) as FC<ContactListProps>;
