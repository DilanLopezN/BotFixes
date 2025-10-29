import { Menu } from 'antd';
import { PermissionResources, UserRoles } from 'kissbot-core';
import React, { FC, Suspense, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { MenuLink } from '../../../../shared-v2/MenuLink';
import { RedirectApp } from '../../../../shared-v2/redirect';
import { MainMenu } from '../../../../shared/MainMenu/styles';
import { LoadingArea, Spin } from '../../../../shared/Spin/spin';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { MenuListGroup } from '../../../../ui-kissbot-v2/common/MenuProps/props';
import { addNotification } from '../../../../utils/AddNotification';
import {
    UserPermission,
    isAnySystemAdmin,
    isSystemAdmin,
    isSystemCsAdmin,
    isSystemDevAdmin,
    isSystemFarmerAdmin,
    isWorkspaceAdmin,
} from '../../../../utils/UserPermission';
import { filteredList } from '../../../../utils/filterPermissionRoles';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../utils/redirectApp';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import EditAutoAssign from '../../components/AutoAssign/components/EditAutoAssign';
import EditPrivacyPolicy from '../../components/PrivacyPolicy/components/EditPrivacyPolicy';
import ViewArea from '../../components/ViewArea';
import { SettingsProps } from '../settings/props';

const { SubMenu } = Menu;

const WorkspaceBillingSpecification = React.lazy(
    () => import('../../components/Billing/components/WorkspaceBillingSpecification')
);
const FeatureFlags = React.lazy(() => import('../../components/FeatureFlags'));
const Billings = React.lazy(() => import('../../components/Billing/components/Billings'));
const Rating = React.lazy(() => import('../../components/Rating'));
const SelfSignWrapper = React.lazy(() => import('../../components/AutoAssign'));
const GeneralSettings = React.lazy(() => import('../../components/GeneralSettings'));
const PrivacyPolicy = React.lazy(() => import('../../components/PrivacyPolicy'));
const TemplateWrapper = React.lazy(() => import('../../components/Template/components/TemplateWrapper'));
const GroupsAccessWrapper = React.lazy(() => import('../../components/GroupAccess/components/GroupsAccessWrapper'));
const AIAgent = React.lazy(() => import('../../components/AIAgent'));
const AgentConfiguration = React.lazy(() => import('../../components/AIAgent/components/AgentConfiguration'));

const Wrapped = styled.div`
    height: 100vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 0px;
        background: transparent;
    }

    scrollbar-width: none;
`;

const Settings: FC<SettingsProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace, loggedUser, match } = props;

    const [menuSelected, setMenuSelected] = useState<any>(undefined);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);

    const location = useLocation();

    useEffect(() => {
        const workspaceId = selectedWorkspace ? selectedWorkspace._id : undefined;
        if (workspaceId) {
            setCurrentWorkspaceId(workspaceId);
        }

        const existCustomPath = getCustomPath();

        if (existCustomPath) {
            return;
        }

        const path = location.pathname.split('/')[2];
        if (path) {
            const menu = menuList.map((group) => {
                return group.list.find((menu) => menu.ref === path);
            });

            setMenuSelected(menu.find((e) => e !== undefined) || menuList[0].list?.[0]);
        } else {
            setMenuSelected(menuList[0].list?.[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkspace, match]);

    const getCustomPath = () => {
        const { params }: any = match;

        const privacyPolicyId = params.privacyPolicyId;
        const autoAssignConversationId = params.autoAssignConversationId;
        const agentId = params.agentId;

        if (privacyPolicyId) {
            setMenuSelected({
                title: getTranslation('Privacy policy'),
                component: EditPrivacyPolicy,
                ref: 'privacy-policy',
            });
            return true;
        }

        if (autoAssignConversationId) {
            setMenuSelected({
                title: getTranslation('Auto assign'),
                component: EditAutoAssign,
                ref: 'auto-assigns',
            });
            return true;
        }

        if (agentId) {
            setMenuSelected({
                title: getTranslation('Configure Agent'),
                component: AgentConfiguration,
                ref: 'ai-agent',
            });
            return true;
        }

        return false;
    };

    const menuList: MenuListGroup[] = [
        {
            title: getTranslation('Configurations'),
            list: [
                {
                    order: 1,
                    title: getTranslation('Users'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/settings/users`}
                            />
                        );
                    },
                    ref: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/settings/users`,
                        appTypePort: APP_TYPE_PORT.V2,
                    }),
                    isAbsolutePath: true,
                },
                {
                    order: 2,
                    title: getTranslation('Templates'),
                    component: TemplateWrapper,
                    ref: 'templates',
                },
                {
                    order: 3,
                    title: getTranslation('Teams'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/settings/teams`}
                            />
                        );
                    },
                    ref: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/settings/teams`,
                        appTypePort: APP_TYPE_PORT.V2,
                    }),
                    isAbsolutePath: true,
                },
                {
                    order: 4,
                    title: getTranslation('Hang tags'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/settings/tags`}
                            />
                        );
                    },
                    ref: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/settings/tags`,
                        appTypePort: APP_TYPE_PORT.V2,
                    }),
                    isAbsolutePath: true,
                },
                {
                    order: 5,
                    title: getTranslation('Groups access'),
                    component: GroupsAccessWrapper,
                    ref: 'groups-access',
                },
                {
                    order: 6,
                    title: getTranslation('Billing specifications'),
                    component: WorkspaceBillingSpecification,
                    ref: 'workspace-billing-specification',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_CS_ADMIN,
                        },
                    ],
                },
                {
                    order: 7,
                    title: getTranslation('General Settings'),
                    component: GeneralSettings,
                    ref: 'general-settings',
                },
                {
                    order: 8,
                    title: getTranslation('Agentes de IA'),
                    component: AIAgent,
                    ref: 'ai-agent',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_CS_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_UX_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                    ],
                },
                {
                    order: 9,
                    title: getTranslation('Privacy policy'),
                    component: PrivacyPolicy,
                    ref: 'privacy-policy',
                },
                {
                    order: 10,
                    title: getTranslation('Categorization'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/settings/categorization`}
                            />
                        );
                    },
                    ref: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/settings/categorization`,
                        appTypePort: APP_TYPE_PORT.V2,
                    }),
                    isAbsolutePath: true,
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.WORKSPACE,
                            role: UserRoles.WORKSPACE_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_CS_ADMIN,
                        },
                    ],
                },
            ],
        },
    ];

    if (selectedWorkspace?.featureFlag?.enableAutoAssign) {
        menuList[0].list.push({
            order: 11,
            title: getTranslation('Auto assigns'),
            component: SelfSignWrapper,
            ref: 'auto-assigns',
        });
    }

    if (
        selectedWorkspace?.generalConfigs?.enableRating ||
        isWorkspaceAdmin(loggedUser, selectedWorkspace?._id) ||
        isAnySystemAdmin(loggedUser)
    ) {
        menuList[0].list.push({
            order: 12,
            title: getTranslation('Rating'),
            component: Rating,
            ref: 'rating',
            roles: [
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_UX_ADMIN,
                },
                {
                    resource: PermissionResources.WORKSPACE,
                    role: UserRoles.WORKSPACE_ADMIN,
                },
            ],
        });
    }

    if (
        selectedWorkspace?.featureFlag?.enableModuleBillings ||
        isSystemAdmin(loggedUser) ||
        isSystemCsAdmin(loggedUser) ||
        isSystemFarmerAdmin(loggedUser)
    ) {
        menuList[0].list.push({
            order: 13,
            title: getTranslation('Billings'),
            component: Billings,
            ref: 'billings',
            roles: [
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.WORKSPACE,
                    role: UserRoles.WORKSPACE_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_FARMER_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
            ],
        });
    }
    if (isAnySystemAdmin(loggedUser)) {
        menuList[0].list.push({
            order: 14,
            title: getTranslation('Features'),
            component: FeatureFlags,
            ref: 'feature-flags',
            roles: [
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_UX_ADMIN,
                },
            ],
        });
    }

    if (
        isSystemAdmin(loggedUser) ||
        isSystemDevAdmin(loggedUser) ||
        selectedWorkspace?.featureFlag?.enableModuleWhatsappFlow
    ) {
        menuList[0].list.push({
            order: 15,
            title: getTranslation('WhatsApp Flow'),
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/settings/whatsapp-flow`}
                    />
                );
            },
            ref: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/settings/whatsapp-flow`,
                appTypePort: APP_TYPE_PORT.V2,
            }),
            isAbsolutePath: true,
            roles: [
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_UX_ADMIN,
                },
                {
                    resource: PermissionResources.WORKSPACE,
                    role: UserRoles.WORKSPACE_ADMIN,
                },
            ],
        });
    }

    if (selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus || isAnySystemAdmin(loggedUser)) {
        menuList[0].list.push({
            order: 14,
            title: getTranslation('Breaks'),
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/settings/breaks`}
                    />
                );
            },
            ref: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/settings/breaks`,
                appTypePort: APP_TYPE_PORT.V2,
            }),
            isAbsolutePath: true,
            roles: [
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.WORKSPACE,
                    role: UserRoles.WORKSPACE_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_UX_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ],
        });
    }

    if (selectedWorkspace?.featureFlag?.enableRemi || isSystemAdmin(loggedUser)) {
        menuList[0].list.push({
            order: 16,
            title: getTranslation('Reengajamento Inteligente'),
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/settings/remi`}
                    />
                );
            },
            ref: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/settings/remi`,
                appTypePort: APP_TYPE_PORT.V2,
            }),
            isAbsolutePath: true,
        });
    }
    if (selectedWorkspace?.featureFlag?.enableAutomaticDistribution || isSystemAdmin(loggedUser)) {
        menuList[0].list.push({
            order: 17,
            title: getTranslation('Distribuição automática'),
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/settings/automatic-distribution`}
                    />
                );
            },
            ref: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/settings/automatic-distribution`,
                appTypePort: APP_TYPE_PORT.V2,
            }),
            isAbsolutePath: true,
        });
    }

    const sortedMenuList = filteredList(menuList, UserPermission);

    return (
        <MainMenu className='settings'>
            <>
                {!!menuList && (
                    <>
                        <Wrapped>
                            <Menu
                                defaultOpenKeys={['configurations']}
                                expandIcon
                                openKeys={['configurations']}
                                title={getTranslation('Configurations')}
                                selectedKeys={[menuSelected?.ref]}
                                mode='inline'
                                style={{
                                    height: '100%',
                                    width: '100%',
                                    backgroundColor: '#fafafa',
                                }}
                            >
                                {sortedMenuList.flatMap((menuGroup) => {
                                    return (
                                        <SubMenu
                                            className='menu-antd'
                                            key='configurations'
                                            title={
                                                <span
                                                    style={{
                                                        fontSize: '13px',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {menuGroup.title}
                                                </span>
                                            }
                                        >
                                            {menuGroup.list
                                                .sort((a, b) => a.order - b.order)
                                                .map((menuItem) => {
                                                    const pathname = menuItem?.isAbsolutePath
                                                        ? menuItem.ref
                                                        : `/settings/${menuItem.ref}`;
                                                    return (
                                                        <Menu.Item
                                                            style={{ paddingLeft: '24px' }}
                                                            title={menuItem.title}
                                                            key={menuItem.ref}
                                                        >
                                                            <MenuLink
                                                                isAbsolutePath={menuItem?.isAbsolutePath}
                                                                to={pathname}
                                                            >
                                                                {menuItem.title}
                                                            </MenuLink>
                                                        </Menu.Item>
                                                    );
                                                })}
                                        </SubMenu>
                                    );
                                })}
                            </Menu>
                        </Wrapped>
                        <Wrapper overflowY={'hidden'} height='100vh' flex>
                            {!!currentWorkspaceId && (
                                <Suspense
                                    fallback={
                                        <LoadingArea>
                                            <Spin />
                                        </LoadingArea>
                                    }
                                >
                                    <ViewArea
                                        menuSelected={menuSelected}
                                        addNotification={addNotification}
                                        selectedWorkspace={selectedWorkspace}
                                        loggedUser={loggedUser}
                                    />
                                </Suspense>
                            )}
                        </Wrapper>
                    </>
                )}
            </>
        </MainMenu>
    );
};
const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(withRouter(connect(mapStateToProps, null)(Settings)));
