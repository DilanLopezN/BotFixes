import { Menu } from 'antd';
import { PermissionResources, UserRoles } from 'kissbot-core';
import React, { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation, withRouter } from 'react-router-dom';
import { MenuLink } from '../../../shared-v2/MenuLink';
import { RedirectApp } from '../../../shared-v2/redirect';
import { MainMenu } from '../../../shared/MainMenu/styles';
import { Wrapper } from '../../../ui-kissbot-v2/common';
import { MenuListGroup } from '../../../ui-kissbot-v2/common/MenuProps/props';
import { addNotification } from '../../../utils/AddNotification';
import {
    UserPermission,
    canViewCampaign,
    canViewSendingList,
    isSystemAdmin,
    isSystemCsAdmin,
    isSystemDevAdmin,
    isSystemSupportAdmin,
} from '../../../utils/UserPermission';
import { filteredList } from '../../../utils/filterPermissionRoles';
import { APP_TYPE_PORT, getBaseUrl } from '../../../utils/redirectApp';
import i18n from '../../i18n/components/i18n';
import { I18nProps } from '../../i18n/interface/i18n.interface';
import ViewArea from '../../settings/components/ViewArea';
import ConfirmationSettingForm from '../components/Confirmation/components/ConfirmationSettingForm';
import EmailSendingSettingForm from '../components/EmailSendingSetting/components/EmailSendingSettingForm';
import { CampaignsProps } from './props';

const CustomFlow = React.lazy(() => import('../components/CustomFlow'));
const Confirmation = React.lazy(() => import('../components/Confirmation'));
const ActiveMessage = React.lazy(() => import('../components/ActiveMessage'));
const ActiveMessageStatus = React.lazy(() => import('../components/ActiveMessageStatus'));
const EmailSendingSetting = React.lazy(() => import('../components/EmailSendingSetting'));
const CancelReason = React.lazy(() => import('../components/CancelReason'));

const { SubMenu } = Menu;

const Campaigns: FC<CampaignsProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace, loggedUser, match } = props;

    const [menuSelected, setMenuSelected] = useState<any>(undefined);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);

    const menuList: MenuListGroup[] = [];
    if (selectedWorkspace?.featureFlag?.campaign && canViewCampaign.can()) {
        menuList.push({
            title: getTranslation('Campaign'),
            list: [
                {
                    order: 1,
                    title: getTranslation('Broadcast list'),
                    component: () => {
                        return (
                            <RedirectApp
                                appTypePort={APP_TYPE_PORT.V2}
                                pathname={`/v2/${selectedWorkspace?._id}/campaigns`}
                            />
                        );
                    },
                    ref: '',
                    href: getBaseUrl({
                        pathname: `/v2/${selectedWorkspace?._id}/campaigns`,
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
                            role: UserRoles.WORKSPACE_AGENT,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                    ],
                },
                {
                    order: 2,
                    title: getTranslation('Custom flow'),
                    component: CustomFlow,
                    ref: 'custom-flow',
                    href: '/campaigns/custom-flow',
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
            ],
        });
    }

    if (isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser) || isSystemCsAdmin(loggedUser) || isSystemSupportAdmin(loggedUser)) {
        menuList.push({
            title: getTranslation('Active message'),
            list: [
                {
                    order: 2,
                    title: getTranslation('Active message'),
                    component: ActiveMessage,
                    ref: 'active-message-settings',
                    href: '/campaigns/active-message-settings',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_SUPPORT_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                    ],
                },
                {
                    order: 3,
                    title: getTranslation('Active message status'),
                    component: ActiveMessageStatus,
                    ref: 'active-message-status',
                    href: '/campaigns/active-message-status',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_SUPPORT_ADMIN,
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

    if (isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser) || isSystemSupportAdmin(loggedUser)) {
        menuList.push({
            title: getTranslation('Email'),
            list: [
                {
                    order: 4,
                    title: getTranslation('Config. envio de E-mail'),
                    component: EmailSendingSetting,
                    ref: 'email-sending-settings',
                    href: '/campaigns/email-sending-settings',
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
                            role: UserRoles.SYSTEM_SUPPORT_ADMIN,
                        },
                    ],
                },
            ],
        });
    }

    if (
        isSystemAdmin(loggedUser) ||
        isSystemDevAdmin(loggedUser) ||
        (selectedWorkspace?.featureFlag?.enableConfirmation && canViewSendingList.can())
    ) {
        const runnerItem = {
            order: 4,
            title: getTranslation('Runners'),
            component: () => {
                return <RedirectApp appTypePort={APP_TYPE_PORT.ADMIN} pathname={`admin/confirmation/runners`} />;
            },
            ref: 'confirmation-runners',
            href: getBaseUrl({ appTypePort: APP_TYPE_PORT.ADMIN, pathname: 'admin/confirmation/runners' }),
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
            ],
        };

        const menu = {
            title: getTranslation('Automatic sending'),
            list: [
                {
                    order: 4,
                    title: getTranslation('Cancellation Reasons'),
                    component: CancelReason,
                    ref: 'cancel-reason',
                    href: '/campaigns/cancel-reason',
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
                    ],
                },
                {
                    order: 4,
                    title: getTranslation('Settings'),
                    component: Confirmation,
                    ref: 'confirmation-settings',
                    href: '/campaigns/confirmation-settings',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_DEV_ADMIN,
                        },
                    ],
                },
            ],
        };

        if (isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser)) {
            menu.list.push(runnerItem as any);
        }

        menuList.push(menu);
    }

    useEffect(() => {
        const workspaceId = selectedWorkspace ? selectedWorkspace._id : undefined;
        if (!workspaceId) return;
        setCurrentWorkspaceId(workspaceId);
    }, [selectedWorkspace]);

    const location = useLocation();
    useEffect(() => {
        const existPath = getPath();
        const path = location.pathname.split('/')[2];

        if (!menuList.length) {
            return;
        }

        if (!existPath) {
            const menu = menuList.map((group) => {
                return group.list.find((menu) => menu.ref === path);
            });

            if (!selectedWorkspace) return;
            setMenuSelected(menu.find((e) => e !== undefined) || menuList[0].list?.[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [match]);

    const getPath = () => {
        const { params }: any = match;

        const campaignId = params.campaignId;
        const scheduleSettingId = params.scheduleSettingId;
        const emailSendingSettingId = params.emailSendingSettingId;
        if (campaignId) {
            setMenuSelected({
                order: 1,
                title: getTranslation('Broadcast list'),
                component: () => {
                    return (
                        <RedirectApp
                            appTypePort={APP_TYPE_PORT.V2}
                            pathname={`/v2/${selectedWorkspace?._id}/campaigns`}
                        />
                    );
                },
                ref: '',
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
                        resource: PermissionResources.WORKSPACE,
                        role: UserRoles.WORKSPACE_ADMIN,
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
            });
            return true;
        }
        if (scheduleSettingId) {
            setMenuSelected({
                order: 1,
                title: getTranslation('Configurações'),
                component: ConfirmationSettingForm,
                ref: 'confirmation-settings',
                roles: [
                    {
                        resource: PermissionResources.ANY,
                        role: UserRoles.SYSTEM_ADMIN,
                    },
                ],
            });
            return true;
        }
        if (emailSendingSettingId) {
            setMenuSelected({
                order: 1,
                title: getTranslation('Config. envio de E-mail'),
                component: EmailSendingSettingForm,
                ref: 'email-sending-settings',
                roles: [
                    {
                        resource: PermissionResources.ANY,
                        role: UserRoles.SYSTEM_ADMIN,
                    },
                    {
                        resource: PermissionResources.ANY,
                        role: UserRoles.SYSTEM_DEV_ADMIN,
                    },
                ],
            });
            return true;
        }
        return false;
    };

    const sortedMenuList = filteredList(menuList, UserPermission);
    return (
        <MainMenu className='campaigns'>
            {!!menuList.length && (
                <>
                    {!!menuList && (
                        <>
                            <Wrapper width='200px' bgcolor='#fafafa' borderRight='1px #d0d0d091 solid' height='100vh'>
                                <Menu
                                    defaultOpenKeys={['Active message']}
                                    expandIcon
                                    openKeys={['Active message']}
                                    selectedKeys={[menuSelected?.ref]}
                                    mode='inline'
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        backgroundColor: '#fafafa',
                                    }}
                                >
                                    {sortedMenuList?.flatMap((item) => {
                                        return (
                                            <SubMenu
                                                className='menu-antd'
                                                key='Active message'
                                                title={
                                                    <span
                                                        style={{
                                                            fontSize: '13px',
                                                            textTransform: 'uppercase',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {item?.title}
                                                    </span>
                                                }
                                            >
                                                {item?.list
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((subItem) => (
                                                        <Menu.Item
                                                            style={{ paddingLeft: '24px' }}
                                                            title={subItem.title}
                                                            key={subItem?.ref}
                                                        >
                                                            <MenuLink
                                                                isAbsolutePath={subItem?.isAbsolutePath}
                                                                to={subItem?.href}
                                                            >
                                                                {subItem?.title}
                                                            </MenuLink>
                                                        </Menu.Item>
                                                    ))}
                                            </SubMenu>
                                        );
                                    })}
                                </Menu>
                            </Wrapper>
                            <Wrapper overflowY={'hidden'} height='100vh' flex>
                                {!!currentWorkspaceId && (
                                    <ViewArea
                                        menuSelected={menuSelected}
                                        addNotification={addNotification}
                                        selectedWorkspace={selectedWorkspace}
                                        loggedUser={loggedUser}
                                    />
                                )}
                            </Wrapper>
                        </>
                    )}
                </>
            )}
        </MainMenu>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(withRouter(connect(mapStateToProps, null)(Campaigns)));
