import { Badge, Tooltip } from 'antd';
import { ConversationTabFilter } from 'kissbot-core';
import debounce from 'lodash/debounce';
import omit from 'lodash/omit';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { DropDown, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { GetFiltersUsersLocal } from '../../../../utils/GetFiltersUsersLocal';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import CommonFilter from '../CommonFilter';
import { tabs, useContersationContainerContext } from '../ConversationContainer/conversation-container.context';
import FilterButton from '../FilterButton';
import ValidateTerms from './components/validateTerms';
import './filter.scss';
import { FilterProps, InfinityOptions, sortTypes } from './props';
import { InfoIcon } from './styles';
import { useSelector } from 'react-redux';

interface ItemDropDown {
    label: any;
    onClick?: Function;
    icon?: string;
}

const TERMS_LIMIT = 10;

const termLengthLimit = {
    [tabs.contacts]: 50,
    [tabs.activities]: 50,
    [tabs.conversations]: 50,
};

const Filter = ({
    loggedUser,
    teams,
    onFiltersApply,
    onNewConversation,
    onApplyConversationsFilter,
    appliedFilters,
    getTranslation,
    onOpenContactList,
    onCreateContact,
    socketConnection,
    workspaceId,
    tabQueries,
    onApplyTextFilter,
}: FilterProps & I18nProps) => {
    const initialInfinity = {
        limit: 20,
        actual: 0,
        hasMore: true,
    } as InfinityOptions;

    const [tabSelected, setTabSelected] = useState(ConversationTabFilter.inbox);
    const [currentAppliedFilters, setCurrentAppliedFilters] = useState<any>(omit(appliedFilters, ['tab', 'sort']));
    const [modalValidateTerms, setModalValidateTerms] = useState(false);
    const [searchLength, setSearchLength] = useState(0);
    const [filterSelected, setFilterSelected] = useState('');
    const [numberOfFilters, setNumberOfFilters] = useState(0);

    const { tabFilterSelected } = useContersationContainerContext();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    const enabledRemi = selectedWorkspace?.userFeatureFlag?.enableRemi && selectedWorkspace?.featureFlag?.enableRemi;

    const filterSelectedRef: any = useRef(null);
    filterSelectedRef.current = {
        filterSelected,
        setFilterSelected,
    };

    useEffect(() => {
        getFilterName();
    }, []);

    useEffect(() => {
        // modo de identificar se houve alteração nos filtros
        const receivedFilters = omit(appliedFilters, ['tab', 'sort']);

        if (!currentAppliedFilters) {
            return setCurrentAppliedFilters(receivedFilters);
        }

        if (
            JSON.stringify(currentAppliedFilters) === JSON.stringify(receivedFilters) ||
            Object.is(currentAppliedFilters, receivedFilters)
        ) {
            return;
        }

        setCurrentAppliedFilters(receivedFilters);
        getFilterName();
    }, [appliedFilters]);

    useEffect(() => {
        setTabSelected(appliedFilters.tab);
    }, [appliedFilters.tab]);

    const handleSelectedTab = (tab: ConversationTabFilter) => {
        setTabSelected(tab);
        const sort = sortTypes[tab];

        loggedUser && onApplyConversationsFilter({ ...initialInfinity }, { tab }, { sort }, false);
    };

    useEffect(() => {
        const numberOfFiltersApplied = Object.keys(appliedFilters.formValues || {}).length;
        setNumberOfFilters(numberOfFiltersApplied);
    }, [appliedFilters]);

    const dropdownItens = [
        {
            label: getTranslation('Create contact'),
            onClick: onCreateContact,
        },
        {
            label: getTranslation('Contact list'),
            onClick: onOpenContactList,
        },
        ...(enabledRemi
            ? [
                  {
                      label: getTranslation('New conversation'),
                      onClick: onNewConversation,
                  },
              ]
            : []),
    ];

    const onDropDownFilters = () => {
        const localUserFilters = GetFiltersUsersLocal();

        if (
            JSON.stringify(localUserFilters) === '{}' ||
            localUserFilters?.[workspaceId] === undefined ||
            localUserFilters?.[workspaceId]?.[loggedUser._id as string] === undefined
        ) {
            return [{}];
        }

        const filters = Object.keys(localUserFilters?.[workspaceId]?.[loggedUser._id as string]).map((item) => {
            return {
                label: localUserFilters?.[workspaceId]?.[loggedUser._id as string]?.[item].name,
                onClick: {
                    filter: { ...localUserFilters?.[workspaceId]?.[loggedUser._id as string]?.[item].filter },
                    label: localUserFilters?.[workspaceId]?.[loggedUser._id as string]?.[item].name,
                },
            };
        });

        return filters;
    };

    const getFilterName = () => {
        const localUserFilters = GetFiltersUsersLocal();

        if (
            JSON.stringify(localUserFilters) === '{}' ||
            localUserFilters?.[workspaceId] === undefined ||
            localUserFilters?.[workspaceId]?.[loggedUser._id as string] === undefined
        ) {
            return;
        }
        const id: any = Object.keys(localUserFilters?.[workspaceId]?.[loggedUser._id as string])?.find((id) => {
            if (
                JSON.stringify(localUserFilters?.[workspaceId]?.[loggedUser._id as string]?.[id]?.filter) ===
                JSON.stringify(appliedFilters.formValues)
            ) {
                return id;
            }
        });
        if (id) {
            return filterSelectedRef.current.setFilterSelected(
                localUserFilters?.[workspaceId]?.[loggedUser._id as string]?.[id]?.name
            );
        }
        return filterSelectedRef.current.setFilterSelected('');
    };

    const getTerms = () => {
        const el: any = document.getElementById('search-input-filter');
        if (!el) {
            return { terms: 0, length: 0 };
        }

        const { value } = el;
        return { terms: value.split(' ').length, length: value.length };
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value) => onApplyTextFilter(value), 800),
        []
    );

    const getTermSizeLimit = () => termLengthLimit[tabFilterSelected] || 50;

    const handleTextFilterChanged = (value: string) => {
        const { terms, length } = getTerms();
        setSearchLength(value?.length);

        const termLimit = getTermSizeLimit();

        if (length > 0 && length < 4) {
            if (length > 1 && value[0] === '#') {
                const sanitized = value?.replace(/[.,]/g, '');

                setModalValidateTerms(false);
                return debouncedSearch(sanitized);
            }
            return;
        } else if (terms > TERMS_LIMIT || length > termLimit) {
            return setModalValidateTerms(true);
        }

        setModalValidateTerms(false);
        return debouncedSearch(value);
    };

    const appliedFiltersText = numberOfFilters === 1 ? 'applied filter' : 'applied filters';

    return (
        <div>
            <Wrapper height='60px' bgcolor='#f2f6f9' flexBox alignItems='center' padding='5px'>
                <Wrapper flexBox height='40px' className='preDefinedFilters'>
                    <div className='btn-group' role='group'>
                        <FilterButton
                            type={ConversationTabFilter.inbox}
                            title='Inbox'
                            icon='home'
                            key={`filter:${ConversationTabFilter.inbox}`}
                            workspaceId={workspaceId}
                            tabQuery={tabQueries && tabQueries[ConversationTabFilter.inbox]}
                            tabSelected={tabSelected}
                            onClick={() => handleSelectedTab(ConversationTabFilter.inbox)}
                            socketConnection={socketConnection}
                            appliedFilters={currentAppliedFilters}
                        />
                        <FilterButton
                            teams={teams}
                            type={ConversationTabFilter.awaitAgent}
                            title={getTranslation('Awaiting agent')}
                            icon='account-clock'
                            key={`filter:${ConversationTabFilter.awaitAgent}`}
                            workspaceId={workspaceId}
                            tabQuery={tabQueries && tabQueries[ConversationTabFilter.awaitAgent]}
                            tabSelected={tabSelected}
                            onClick={() => handleSelectedTab(ConversationTabFilter.awaitAgent)}
                            socketConnection={socketConnection}
                            appliedFilters={currentAppliedFilters}
                        />
                        <FilterButton
                            type={ConversationTabFilter.teams}
                            title={getTranslation('Teams')}
                            icon='account-group'
                            key={`filter:${ConversationTabFilter.teams}`}
                            workspaceId={workspaceId}
                            tabQuery={tabQueries && tabQueries[ConversationTabFilter.teams]}
                            tabSelected={tabSelected}
                            onClick={() => handleSelectedTab(ConversationTabFilter.teams)}
                            socketConnection={socketConnection}
                            appliedFilters={currentAppliedFilters}
                        />
                        <FilterButton
                            type={ConversationTabFilter.bot}
                            title='Bot'
                            icon='robot'
                            key={`filter:${ConversationTabFilter.bot}`}
                            showCount={false}
                            workspaceId={workspaceId}
                            tabQuery={tabQueries && tabQueries[ConversationTabFilter.bot]}
                            tabSelected={tabSelected}
                            onClick={() => handleSelectedTab(ConversationTabFilter.bot)}
                        />
                        <FilterButton
                            type={ConversationTabFilter.all}
                            title={getTranslation('All')}
                            icon='view-list'
                            key={`filter:${ConversationTabFilter.all}`}
                            workspaceId={workspaceId}
                            showCount={false}
                            tabQuery={tabQueries && tabQueries[ConversationTabFilter.all]}
                            tabSelected={tabSelected}
                            onClick={() => handleSelectedTab(ConversationTabFilter.all)}
                        />
                        {enabledRemi && (
                            <FilterButton
                                type={ConversationTabFilter.smt_re}
                                title={getTranslation('REMI')}
                                icon='timetable'
                                key={`filter:${ConversationTabFilter.smt_re}`}
                                workspaceId={workspaceId}
                                showCount={false}
                                tabQuery={tabQueries && tabQueries[ConversationTabFilter.smt_re]}
                                tabSelected={tabSelected}
                                onClick={() => handleSelectedTab(ConversationTabFilter.smt_re)}
                            />
                        )}
                    </div>
                </Wrapper>

                {!enabledRemi && (
                    <>
                        <Wrapper width='100%' />
                        <Wrapper flexBox margin='0 5px 0 7px' alignItems='center' justifyContent='center'>
                            <span
                                title={getTranslation('New conversation')}
                                onClick={() => onNewConversation()}
                                style={{ cursor: 'pointer' }}
                                className={`mdi mdi-24px mdi-email-edit-outline`}
                            />
                        </Wrapper>
                    </>
                )}

                <DropDown
                    title={getTranslation('More options')}
                    iconName='dots-vertical'
                    itens={dropdownItens}
                    height='100%'
                    colorType={ColorType.white}
                />
            </Wrapper>
            <Wrapper bgcolor='#f2f6f9' padding='0 5px 0 0' flexBox>
                <Wrapper
                    flexBox
                    flex
                    alignItems='center'
                    justifyContent='space-between'
                    height='60px'
                    position='relative'
                    borderBottom='1px #e4e4e4 solid'
                    padding='12px 5px'
                >
                    <ValidateTerms
                        visible={modalValidateTerms}
                        onVisibleChange={(visible) => setModalValidateTerms(visible)}
                        sizeLimit={getTermSizeLimit()}
                        onConfirm={() => {
                            setModalValidateTerms(false);
                            const el: any = document.getElementById('search-input-filter');
                            el?.focus();
                        }}
                    >
                        <CommonFilter
                            placeholder={`${getTranslation('Search attendances, messages')}..`}
                            onChange={handleTextFilterChanged}
                            initialValue={appliedFilters.search}
                            allowClear
                        />
                        <Tooltip
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.2}
                            trigger={'hover'}
                            placement={'bottom'}
                            title={() => {
                                return (
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>{getTranslation('Enter at least 4 characters to search.')}</li>
                                        <li>
                                            {getTranslation(
                                                'Only messages typed by the attendant or patient will be searched.'
                                            )}
                                        </li>
                                        <li>{getTranslation('Search by conversation ID. Ex: #22554.')}</li>
                                    </ul>
                                );
                            }}
                        >
                            <InfoIcon style={{ visibility: searchLength <= 0 ? 'visible' : 'hidden' }} />
                        </Tooltip>
                    </ValidateTerms>
                </Wrapper>
                {onDropDownFilters().length && JSON.stringify(onDropDownFilters()[0]) !== '{}' ? (
                    <DropDown
                        width='30px'
                        selected={filterSelectedRef.current.filterSelected}
                        title={getTranslation('My filters')}
                        iconName='dots-vertical'
                        itens={onDropDownFilters() as ItemDropDown[]}
                        height='100%'
                        margin='0'
                        right
                        colorType={ColorType.white}
                        handleClick={(params) => {
                            const sort = sortTypes[tabSelected];
                            filterSelectedRef.current.setFilterSelected(params.label);
                            onApplyConversationsFilter({ ...initialInfinity }, { ...params.filter }, { sort }, false);
                        }}
                    />
                ) : null}
                <Wrapper flexBox alignItems='center' justifyContent='center' margin='0 3px 0 7px'>
                    <Tooltip
                        mouseLeaveDelay={0}
                        mouseEnterDelay={0.4}
                        placement='rightTop'
                        title={getTranslation('Filters')}
                    >
                        <span
                            onClick={() => onFiltersApply()}
                            style={{ cursor: 'pointer' }}
                            className={`mdi mdi-24px mdi-${numberOfFilters ? 'filter' : 'filter-outline'}`}
                        />
                    </Tooltip>
                    {numberOfFilters > 0 && (
                        <Tooltip
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.4}
                            placement='rightTop'
                            title={`${numberOfFilters} ${getTranslation(appliedFiltersText)}`}
                        >
                            <span onClick={() => onFiltersApply()}>
                                <Badge
                                    color='#1890ff'
                                    size='small'
                                    style={{ position: 'absolute', right: -5 }}
                                    className='white-text'
                                    count={numberOfFilters}
                                    title='' // se não estiver como valor vazio ele mostra o numero de fitro por padrão.
                                />
                            </span>
                        </Tooltip>
                    )}
                </Wrapper>
            </Wrapper>
        </div>
    );
};

export default i18n(Filter) as FC<FilterProps>;
