import { FC, useState, useEffect } from 'react';
import { User, UserRoles as UserRolesEnum } from 'kissbot-core';
import { Wrapper, UserAvatar } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import { hasRoleInWorkspace } from '../../../../utils/UserPermission';
import { UserListProps } from './props';
import { Input, Select } from 'antd';
import debounce from 'lodash/debounce';
import { Card, FiltersWrapper, SelectStyle } from './styled';
import styled from 'styled-components';
import { timeout } from '../../../../utils/Timer';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import SkeletonLines from '../../../../shared/skeleton-lines';
import moment from 'moment';
import { searchResult } from '../../../../utils/SearchResult';

const EmptyImage = styled('img')`
    height: 125px;
`;

const UserList: FC<UserListProps & I18nProps> = ({
    selectedWorkspace,
    onUserSelect,
    messageUserLimit,
    getTranslation,
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [usersFiltered, setUsersFiltered] = useState<User[]>([]);
    const [usersInactives, setUsersInactives] = useState(0);
    const [searchFilter, setSearchFilter] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [selectUser, setSelectUser] = useState(0);

    const fetchWorkspaceUsers = async () => {
        if (selectedWorkspace?._id) {
            const data: PaginatedModel<User> = await WorkspaceUserService.getAll(selectedWorkspace._id, 'name');

            if (data && data.data.length) {
                setUsersInactives(filterUsersInactives(data.data).length);
                setUsers(orderedUsers(data.data));
                setUsersFiltered(data.data);
            }
        }
        timeout(() => setLoading(false), 100);
    };
    useEffect(() => {
        const handleLoad = (): void => {
            setLoading(true)
            timeout(() => fetchWorkspaceUsers(), 3000);
        };

        window.addEventListener('load', handleLoad);

        return () => {
            window.removeEventListener('load', handleLoad);
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        debounceChange();
    }, [searchFilter, selectedWorkspace]);

    useEffect(() => {
        switch (selectUser) {
            case 0:
                setUsersFiltered(users);
                break;
            case 1:
                setUsersFiltered(
                    users.filter((user) =>
                        user.roles?.find(
                            (r) =>
                                r.role === UserRolesEnum.SYSTEM_ADMIN ||
                                r.role === UserRolesEnum.WORKSPACE_ADMIN ||
                                r.role === UserRolesEnum.WORKSPACE_AGENT
                        )
                    )
                );
                break;
            case 2:
                setUsersFiltered(filterUsersInactives(users));
                break;
            default:
                break;
        }
    }, [selectUser]);

    const resolveRoleLabel = (user: User): string => {
        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_ADMIN, selectedWorkspace._id)) {
            return getTranslation('Admin');
        }

        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_AGENT, selectedWorkspace._id)) {
            return getTranslation('Agent');
        }

        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_INACTIVE, selectedWorkspace._id)) {
            return getTranslation('Inactive');
        }

        return '';
    };

    const debounceChange = debounce((): void => {
        if (searchFilter) {
            const filteredUsers = searchResult(searchFilter, users, ['name', 'email']);

            setUsersFiltered(filteredUsers);
        } else {
            fetchWorkspaceUsers();
        }
        setLoading(false);
    }, 500);

    const filterUsersInactives = (users) => {
        const inactives = users.filter((user) => {
            return user.roles?.find((r) => {
                return r.role === UserRolesEnum.WORKSPACE_INACTIVE;
            });
        });

        return inactives;
    };

    const orderedUsers = (users) => {
        const inactives = filterUsersInactives(users);

        const actives = users.filter((user) => {
            return user.roles?.find((r) => {
                return (
                    r.role === UserRolesEnum.SYSTEM_ADMIN ||
                    r.role === UserRolesEnum.WORKSPACE_ADMIN ||
                    r.role === UserRolesEnum.WORKSPACE_AGENT
                );
            });
        });

        let list = actives;

        if (inactives.length > 0) {
            inactives.forEach((user) => {
                list.push(user);
            });
        }

        return list;
    };

    const handleSelectUser = (value) => {
        if (value === undefined) {
            setSelectUser(0);
        } else {
            setSelectUser(value);
        }
    };

    const sortedUser = usersFiltered
        .map((user) => ({ ...user }))
        .sort((a, b) => {
            if (a.roles![0].role === 'WORKSPACE_INACTIVE' && b.roles![0].role !== 'WORKSPACE_INACTIVE') {
                return 1;
            }
            if (b.roles![0].role === 'WORKSPACE_INACTIVE' && a.roles![0].role !== 'WORKSPACE_INACTIVE') {
                return -1;
            }
            return 0;
        });

    return (
        <Wrapper>
            <FiltersWrapper>
                <Wrapper flexBox alignItems='center'>
                    {`${users.length} ${getTranslation('registered users, being')} ${usersInactives} ${getTranslation(
                        usersInactives === 1 || usersInactives === 0 ? 'inactive' : 'inactives'
                    )}.`}
                    <br />
                    {`${messageUserLimit.userCount}/${messageUserLimit.planUserLimit} ${getTranslation(
                        'amount contracted in the plan'
                    )}.`}
                </Wrapper>
                <Wrapper flexBox justifyContent='flex-end' alignItems='flex-start'>
                    <SelectStyle
                        value={selectUser}
                        style={{ width: '200px' }}
                        onChange={handleSelectUser}
                        allowClear={selectUser === 0 ? false : true}
                    >
                        <Select.Option value={0}>{getTranslation('All users')}</Select.Option>
                        <Select.Option value={1}>{getTranslation('Actives')}</Select.Option>
                        <Select.Option value={2}>{getTranslation('Inactives')}</Select.Option>
                    </SelectStyle>
                    <Wrapper width='58%' position='relative' right='-10px'>
                        <Input.Search
                            allowClear
                            autoFocus
                            style={{
                                height: '38px',
                                border: 'none',
                            }}
                            placeholder={getTranslation('Find users in workspace')}
                            onChange={(ev: any) => setSearchFilter(ev.target.value)}
                        />
                    </Wrapper>
                </Wrapper>
            </FiltersWrapper>
            {loading ? (
                <SkeletonLines
                    rows={2}
                    size={5}
                    style={{
                        borderRadius: '6px',
                        padding: '5px 15px',
                        margin: '0 0 10px 0',
                        height: '70px',
                    }}
                />
            ) : usersFiltered.length ? (
                <>
                    <Wrapper
                        borderRadius='5px 5px 0 0'
                        border='1px #CED4DA solid'
                        bgcolor='#f2f2f2'
                        width='100%'
                        minWidth='320px'
                        height='45px'
                        color='#555'
                        fontSize='large'
                        padding='10px'
                    >
                        {getTranslation('Users')}
                    </Wrapper>
                    {sortedUser.map((user, index) => (
                        <div
                            onAuxClick={() => window.open(`${window.location.origin}/settings/users?user=${user?._id}`)}
                        >
                            <Card key={index} onClick={() => onUserSelect(user)}>
                                <Wrapper flexBox alignItems='center'>
                                    <Wrapper>
                                        <UserAvatar user={user} hashColor={`${user._id}${user._id}`} size={40} />
                                    </Wrapper>
                                    <Wrapper margin='0 12px'>
                                        <Wrapper>
                                            <b>{user.name}</b>
                                        </Wrapper>
                                        <Wrapper fontSize='13px'>{user.email}</Wrapper>
                                    </Wrapper>
                                </Wrapper>

                                <Wrapper flexBox flexDirection='column' textAlign='right'>
                                    <span>{resolveRoleLabel(user)}</span>
                                    {user.passwordExpires && (
                                        <span
                                            style={{
                                                color: 'red',fontSize: '13px'
                                            }}
                                        >
                                            {moment().valueOf() >= user.passwordExpires &&
                                                `${getTranslation('Expired password')}`}
                                        </span>
                                    )}
                                </Wrapper>
                            </Card>
                        </div>
                    ))}
                </>
            ) : (
                <Wrapper height='150px' flexBox margin='30px 0 0 0' justifyContent='center' alignItems='center'>
                    <Wrapper>
                        <Wrapper flexBox justifyContent='center'>
                            <EmptyImage src='/assets/img/empty_draw.svg' />
                        </Wrapper>
                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                            {getTranslation('There are no users to display here')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default I18n(UserList) as FC<UserListProps>;
