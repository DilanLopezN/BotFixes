import { Menu, Popover } from 'antd';
import { PermissionResources, UserRoles } from 'kissbot-core';
import React, { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { MenuLink } from '../../../../shared-v2/MenuLink';
import { RedirectApp } from '../../../../shared-v2/redirect';
import { MainMenu } from '../../../../shared/MainMenu/styles';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { MenuListGroup } from '../../../../ui-kissbot-v2/common/MenuProps/props';
import { filteredList } from '../../../../utils/filterPermissionRoles';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../utils/redirectApp';
import {
    UserPermission,
    canViewSendingList,
    isAnySystemAdmin,
    isSystemAdmin,
    isSystemDevAdmin,
    isWorkspaceAdmin,
} from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import ViewArea from '../../../settings/components/ViewArea';
import TabAppointments from '../../components/TabAppointments';
import TabGraphics from '../../components/TabGraphics';
import './Dashboard.scss';
import { DashboardProps } from './DashboardProps';

const TabUsers = React.lazy(() => import('../../components/TabUsers'));
const TabRatings = React.lazy(() => import('../../components/TabRatings'));
const TabRealTime = React.lazy(() => import('../../components/TabRealTime'));
const TabFallback = React.lazy(() => import('../../components/TabFallback'));
const TabConversation = React.lazy(() => import('../../components/TabConversation'));

const { SubMenu } = Menu;

const DashboardComponent: FC<DashboardProps & I18nProps> = ({
    selectedWorkspace,
    getTranslation,
    loggedUser,
    match,
}) => {
    const menuList: MenuListGroup[] = [
        {
            title: getTranslation('Dashboard'),
            list: [
                {
                    order: 1,
                    title: getTranslation('Real time'),
                    component: TabRealTime,
                    ref: 'real-time',
                    href: '/dashboard/real-time',
                },
                {
                    order: 2,
                    title: getTranslation('My reports'),
                    component: TabGraphics,
                    ref: 'graphics',
                    href: '/dashboard/graphics',
                },
                {
                    order: 3,
                    title: getTranslation('Conversations'),
                    component: TabConversation,
                    ref: 'conversations',
                    href: '/dashboard/conversations',
                },
                {
                    order: 5,
                    title: getTranslation('Agents'),
                    component: TabUsers,
                    ref: 'agents',
                    href: '/dashboard/agents',
                },
                {
                    order: 8,
                    title: getTranslation('Fallbacks'),
                    component: TabFallback,
                    ref: 'fallbacks',
                    href: '/dashboard/fallbacks',
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
                },
                {
                    order: 7,
                    title: getTranslation('Appointments'),
                    component: TabAppointments,
                    ref: 'appointments',
                    href: '/dashboard/appointments',
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
                },
                {
                    order: 9,
                    title: getTranslation('Categorization'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/dashboard/categorization-dashboard`}
                            />
                        );
                    },
                    ref: 'categorization-dashboard',
                    href: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/dashboard/categorization-dashboard`,
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
                            resource: PermissionResources.WORKSPACE,
                            role: UserRoles.WORKSPACE_ADMIN,
                        },
                    ],
                },
            ],
        },
    ];

    if (
        selectedWorkspace?.generalConfigs?.enableRating ||
        isWorkspaceAdmin(loggedUser, selectedWorkspace?._id) ||
        isAnySystemAdmin(loggedUser)
    ) {
        menuList[0].list.push({
            order: 6,
            title: getTranslation('Ratings'),
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/dashboard/ratings`}
                    />
                );
            },
            ref: 'ratings',
            href: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/dashboard/ratings`,
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
                {
                    resource: PermissionResources.WORKSPACE,
                    role: UserRoles.DASHBOARD_ADMIN,
                },
            ],
        });
    }

    if (
        isSystemAdmin(loggedUser) ||
        isSystemDevAdmin(loggedUser) ||
        (selectedWorkspace?.featureFlag?.enableConfirmation && canViewSendingList.can())
    ) {
        menuList.push({
            title: getTranslation('Envios'),
            list: [
                {
                    order: 4,
                    title: getTranslation('Automatic sending'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/dashboard/sending-list`}
                            />
                        );
                    },
                    ref: 'shipping-list',
                    href: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/dashboard/sending-list`,
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
                            resource: PermissionResources.WORKSPACE,
                            role: UserRoles.WORKSPACE_AGENT,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                    ],
                },
            ],
        });
    }

    if (selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus || isAnySystemAdmin(loggedUser)) {
        menuList[0].list.push({
            order: 9,
            title: 'Pausas',
            component: () => {
                return (
                    <RedirectApp
                        appTypePort={APP_TYPE_PORT.V2}
                        pathname={`/v2/${selectedWorkspace?._id}/dashboard/breaks`}
                    />
                );
            },
            ref: 'breaks',
            href: getBaseUrl({
                pathname: `/v2/${selectedWorkspace?._id}/dashboard/breaks`,
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

    const [menuSelected, setMenuSelected] = useState<any>(undefined);

    const location = useLocation();
    useEffect(() => {
        const path = location.pathname.split('/')[2];

        if (path) {
            const menu = menuList.map((group) => {
                return group.list.find((menu) => menu.ref === path);
            });

            setMenuSelected(menu.find((e) => e !== undefined) || menuList[0].list?.[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [match]);

    const sortedMenuList = filteredList(menuList, UserPermission);
    return (
        <MainMenu>
            {!!menuList && (
                <>
                    <Wrapper
                        bgcolor='#fafafa'
                        borderRight='1px #d0d0d091 solid'
                        height='100vh'
                        style={{
                            minWidth: '180px',
                            maxWidth: '200px',
                            position: 'relative',
                        }}
                    >
                        <Menu
                            defaultOpenKeys={['Dashboard']}
                            expandIcon
                            openKeys={['Dashboard']}
                            title={getTranslation('Dashboard')}
                            selectedKeys={[menuSelected?.ref]}
                            mode='inline'
                            style={{
                                height: '100%',
                                width: '100%',
                                backgroundColor: '#fafafa',
                            }}
                        >
                            {sortedMenuList.flatMap((item) => {
                                return (
                                    <SubMenu
                                        className='menu-antd'
                                        key='Dashboard'
                                        title={
                                            <span
                                                style={{
                                                    fontSize: '13px',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {item.title}
                                            </span>
                                        }
                                    >
                                        {item.list
                                            .sort((a, b) => a.order - b.order)
                                            .map((subItem) => (
                                                <Menu.Item
                                                    style={{ paddingLeft: '24px' }}
                                                    title={subItem.title}
                                                    key={subItem.ref}
                                                >
                                                    <MenuLink
                                                        isAbsolutePath={subItem?.isAbsolutePath}
                                                        to={subItem.href}
                                                    >
                                                        <Popover content={subItem.title} trigger='hover'>
                                                            {subItem.title}
                                                        </Popover>
                                                    </MenuLink>
                                                </Menu.Item>
                                            ))}
                                    </SubMenu>
                                );
                            })}
                        </Menu>
                    </Wrapper>
                    <>
                        {!!selectedWorkspace && (
                            <ViewArea
                                menuSelected={menuSelected}
                                selectedWorkspace={selectedWorkspace}
                                loggedUser={loggedUser}
                            />
                        )}
                    </>
                </>
            )}
        </MainMenu>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    loggedUser: state.loginReducer.loggedUser,
});

const Dashboard = i18n(connect(mapStateToProps, {})(DashboardComponent));

export { Dashboard };
