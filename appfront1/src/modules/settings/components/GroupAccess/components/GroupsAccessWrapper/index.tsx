import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { GroupsAccessWrapperProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { useParams, withRouter } from 'react-router-dom';
import { ScrollView } from '../../../ScrollView';
import Header from '../../../../../newChannelConfig/components/Header';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import SearchField from '../../../SearchField';
import { timeout } from '../../../../../../utils/Timer';
import GroupsAccessList from '../GroupsAccessList';
import { WorkspaceAccessControl } from './interface';
import EditGroupAccess from '../EditGroupAccess';
import { SettingsService } from '../../../../service/SettingsService';
import { User } from 'kissbot-core';
import { WorkspaceUserService } from '../../../../service/WorkspaceUserService';
import { OptionModalMenu } from '../../../MenuSelection';
import MenuSelection from '../../../MenuSelection';
import EditGroupSection from '../EditGroupSection';
import UserGroupSection from '../UserGroupSection';
import { Button, Pagination } from 'antd';
import { SearchFilters } from '../../../../interfaces/search-filters.interface';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';
import { TextLink } from '../../../../../../shared/TextLink/styled';

const GroupsAccessWrapper: FC<GroupsAccessWrapperProps & I18nProps> = ({
    addNotification,
    getTranslation,
    match,
    history,
    workspaceId,
    location,
}) => {
    const getInitialComponent = useCallback(() => {
        const query = new URLSearchParams(location.search);

        if (!!query.get('group')) {
            return ComponentManagerEnum.UPDATE_FORM;
        }
        return ComponentManagerEnum.LIST;
    }, [location.search]);

    const options: OptionModalMenu[] = [
        {
            label: getTranslation('Edit'),
            ref: 'edit',
            component: EditGroupSection,
        },
        {
            label: getTranslation('Users'),
            ref: 'users',
            component: UserGroupSection,
        },
    ];
    const { groupsId } = useParams<{ groupsId?: string }>();
    const [currentComponent, setCurrentComponent] = useState<ComponentManagerEnum>(getInitialComponent());
    const [currentGroup, setCurrentGroup] = useState<WorkspaceAccessControl | undefined>(undefined);
    const [selectedTab, setSelectedTab] = useState<OptionModalMenu>(options[0]);
    const [workspaceGroups, setWorkspaceGroups] = useState<WorkspaceAccessControl[]>([]);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const handleBackToListClick = (event?): void => {
        event?.preventDefault();
        history.push(`/settings/groups-access`);
    };

    const handleUserCreation = (): void => {
        setCurrentGroup(undefined);
        setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
    };

    const onCreatedGroup = () => {
        setCurrentComponent(ComponentManagerEnum.LIST);
        setLoading(true);
    };

    const onUpdatedGroup = () => {
        history.push(`/settings/groups-access`);
        setCurrentGroup(undefined);
        setCurrentComponent(ComponentManagerEnum.LIST);
        setLoading(true);
        setLoadingRequest(false);
    };

    const onEditGroup = (groupId: string) => {
        const currGroup = workspaceGroups.find((group) => group._id === groupId);

        if (currGroup) {
            setCurrentGroup(currGroup);
        }

        history.push(`/settings/groups-access/${groupId}`);
    };

    const onDeletedGroup = (groupId: string) => {
        const newGroups = workspaceGroups.filter((tag) => tag._id !== groupId);
        setWorkspaceGroups(newGroups);

        if (currentComponent === ComponentManagerEnum.UPDATE_FORM) {
            handleBackToListClick();
        }
    };

    const [filters, setFilters] = useState<SearchFilters>({
        search: '',
        skip: 0,
        limit: 10,
        origin: '',
    });
    const [notLoadingMore, setNotLoadingMore] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    const notLoadingMoreRef: any = useRef(null);
    notLoadingMoreRef.current = { notLoadingMore, setNotLoadingMore };

    const loadingMoreRef: any = useRef(null);
    loadingMoreRef.current = { loadingMore, setLoadingMore };

    const getGroupAccessById = async (groupId) => {
        const group = await SettingsService.getGroupAccess(workspaceId as string, groupId as string);

        if (!group) {
            setCurrentGroup(undefined);
            return history.push(`/settings/groups-access`);
        }
        setLoadingRequest(false);
        setCurrentGroup(group);
    };

    const getWorkspaceGroupsAccess = async (newFilter: SearchFilters) => {
        const response = (await SettingsService.getGroupsAccess(newFilter, workspaceId as string)) as any;

        if (response) {
            setWorkspaceGroups(response?.data || []);
            setFilters({ ...newFilter, total: response?.count });
        }

        timeout(() => setLoading(false), 100);
    };

    const getWorkspaceUsers = async () => {
        try {
            const query = {
                $and: [
                    {
                        'roles.role': {
                            $nin: ['WORKSPACE_INACTIVE'],
                        },
                    },
                ],
            };
            const response = await WorkspaceUserService.getAll(workspaceId as string, undefined, query);
            if (response?.data) {
                setWorkspaceUsers(response.data);
            }
        } catch (e) {
            console.log('error on load users', e);
        }
    };

    const onSearch = (filter: SearchFilters) => {
        if (notLoadingMoreRef.current.notLoadingMore) notLoadingMoreRef.current.setNotLoadingMore(false);

        setFilters({
            ...filter,
            origin: 'search',
            skip: 0,
        });
    };

    useEffect(() => {
        getWorkspaceUsers();
    }, []);

    useEffect(() => {
        if (groupsId) {
            getGroupAccessById(groupsId);
            setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
        } else {
            setCurrentComponent(ComponentManagerEnum.LIST);
        }
    }, [groupsId]);

    useEffect(() => {
        if (currentComponent === ComponentManagerEnum.LIST) {
            if (filters.origin === 'search') {
                setLoading(true);
            }
            getWorkspaceGroupsAccess(filters);
        }
    }, [filters.search, workspaceId, currentComponent]);

    return (
        <>
            <Wrapper>
                <Header
                    title={
                        currentGroup?.name ? (
                            <div style={{ display: 'flex' }}>
                                <TextLink href='#' onClick={handleBackToListClick}>
                                    {getTranslation('Groups access')}
                                </TextLink>
                                <div style={{ margin: '0 7px' }}>{' / '}</div>
                                <div
                                    style={{
                                        width: '250px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: '-15px',
                                    }}
                                >
                                    {currentGroup?.name}
                                </div>
                            </div>
                        ) : (
                            getTranslation('Groups access')
                        )
                    }
                    action={
                        currentComponent === ComponentManagerEnum.LIST ? (
                            <Button
                                onClick={() => handleUserCreation()}
                                className='antd-span-default-color'
                                type='primary'
                            >
                                {getTranslation('Add')}
                            </Button>
                        ) : undefined
                    }
                ></Header>
                {currentComponent === ComponentManagerEnum.UPDATE_FORM && (
                    <MenuSelection
                        options={options}
                        onSelect={(option: OptionModalMenu) => setSelectedTab(option)}
                        selected={selectedTab}
                    />
                )}
            </Wrapper>
            <ScrollView id='content-groups'>
                <Wrapper margin='0 auto 40px' maxWidth='1100px' padding={'20px 30px'}>
                    {currentComponent === ComponentManagerEnum.LIST && (
                        <>
                            <Wrapper position='relative' left='60%' width='40%' margin='0 0 15px 0'>
                                <SearchField
                                    filters={filters}
                                    placeholder={'Find a group access'}
                                    onChange={(filter: SearchFilters) => onSearch(filter)}
                                />
                            </Wrapper>
                            <GroupsAccessList
                                loading={loading}
                                loadingMore={false}
                                workspaceGroups={workspaceGroups}
                                onEditGroup={onEditGroup}
                            />

                            {workspaceGroups.length > 0 ? (
                                <Pagination
                                    style={{ marginTop: '20px', display: 'flex', justifyContent: 'end' }}
                                    total={filters.total || 0}
                                    pageSize={filters.limit}
                                    onChange={(page, pageSize) => {
                                        const newFilters: SearchFilters = {
                                            ...filters,
                                            skip: (page - 1) * filters.limit,
                                            limit: pageSize,
                                        };

                                        setFilters(newFilters);
                                        getWorkspaceGroupsAccess(newFilters);
                                    }}
                                    showSizeChanger
                                    defaultCurrent={1}
                                />
                            ) : null}
                        </>
                    )}
                    {currentComponent === ComponentManagerEnum.UPDATE_FORM && (
                        <EditGroupAccess
                            onUpdatedGroup={onUpdatedGroup}
                            onCreatedGroup={onCreatedGroup}
                            group={currentGroup}
                            onCancel={handleBackToListClick}
                            addNotification={addNotification}
                            workspaceId={workspaceId as string}
                            userList={workspaceUsers}
                            onDeletedGroup={onDeletedGroup}
                            loadingRequest={loadingRequest}
                            editing={location.search ? true : false}
                            selectedTab={selectedTab}
                            setCurrentComponent={setCurrentComponent}
                        />
                    )}
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default I18n(withRouter(connect(mapStateToProps, null)(GroupsAccessWrapper)));
