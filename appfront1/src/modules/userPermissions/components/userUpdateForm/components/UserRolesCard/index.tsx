import { useEffect, FC } from 'react';
import styled from 'styled-components';
import { UserRoles as UserRolesEnum } from 'kissbot-core';
import I18n from '../../../../../i18n/components/i18n';
import { Card } from '../../../../../../ui-kissbot-v2/common';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import {
    hasRoleInWorkspace,
    isOwnProfile,
    removeUserWorkspaceRolesDiffFrom,
} from '../../../../../../utils/UserPermission';
import { UserRolesCardProps } from './props';

const RoleItem = styled.label`
    padding: 8px 10px;
    border-bottom: 1px solid #ced4da;
    margin: 0;
    cursor: pointer;
`;

const UserRolesCard: FC<UserRolesCardProps & I18nProps> = ({
    user,
    role,
    selectedWorkspace,
    loggedUser,
    onChange,
    getTranslation,
}) => {
    const fixUserWorkspaceRoles = async (): Promise<void> => {
        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_ADMIN, selectedWorkspace._id)) {
            await removeUserWorkspaceRolesDiffFrom(user, UserRolesEnum.WORKSPACE_ADMIN, selectedWorkspace._id);
            return onChange(UserRolesEnum.WORKSPACE_ADMIN);
        }

        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_AGENT, selectedWorkspace._id)) {
            await removeUserWorkspaceRolesDiffFrom(user, UserRolesEnum.WORKSPACE_AGENT, selectedWorkspace._id);
            return onChange(UserRolesEnum.WORKSPACE_AGENT);
        }

        if (hasRoleInWorkspace(user, UserRolesEnum.WORKSPACE_INACTIVE, selectedWorkspace._id)) {
            await removeUserWorkspaceRolesDiffFrom(user, UserRolesEnum.WORKSPACE_INACTIVE, selectedWorkspace._id);
            return onChange(UserRolesEnum.WORKSPACE_INACTIVE);
        }

        console.error(`Could not fix workspace roles for user [${user._id}]`);
    };

    useEffect(() => {
        fixUserWorkspaceRoles();
    }, []);

    useEffect(() => {
        if (!role) {
            fixUserWorkspaceRoles();
        }
    }, [role]);

    return (
        <div style={{ margin: '15px 0 0 0' }}>
            <Card header={getTranslation('Permission')} padding='0'>
                <RoleItem htmlFor='admin-role-input'>
                    <input
                        id='admin-role-input'
                        type='radio'
                        disabled={isOwnProfile(loggedUser, user)}
                        checked={role === UserRolesEnum.WORKSPACE_ADMIN}
                        onChange={() => onChange(UserRolesEnum.WORKSPACE_ADMIN)}
                    />

                    <span style={{ marginLeft: '10px' }}>{getTranslation('Admin')}</span>
                </RoleItem>

                <RoleItem htmlFor='agent-role-input'>
                    <input
                        id='agent-role-input'
                        type='radio'
                        disabled={isOwnProfile(loggedUser, user)}
                        checked={role === UserRolesEnum.WORKSPACE_AGENT}
                        onChange={() => onChange(UserRolesEnum.WORKSPACE_AGENT)}
                    />

                    <span style={{ marginLeft: '10px' }}>{getTranslation('Agent')}</span>
                </RoleItem>

                <RoleItem htmlFor='inactive-role-input'>
                    <input
                        id='inactive-role-input'
                        type='radio'
                        disabled={isOwnProfile(loggedUser, user)}
                        checked={role === UserRolesEnum.WORKSPACE_INACTIVE}
                        onChange={() => onChange(UserRolesEnum.WORKSPACE_INACTIVE)}
                    />

                    <span style={{ marginLeft: '10px' }}>{getTranslation('Inactive')}</span>
                </RoleItem>
            </Card>
        </div>
    );
};

export default I18n(UserRolesCard) as FC<UserRolesCardProps>;
