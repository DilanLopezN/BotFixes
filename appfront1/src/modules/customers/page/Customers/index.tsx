import { Menu } from 'antd';
import { PermissionResources, UserRoles } from 'kissbot-core';
import React, { FC, Suspense, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation, withRouter } from 'react-router-dom';
import { MenuLink } from '../../../../shared-v2/MenuLink';
import { MainMenu } from '../../../../shared/MainMenu/styles';
import { LoadingArea, Spin } from '../../../../shared/Spin/spin';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { MenuListGroup } from '../../../../ui-kissbot-v2/common/MenuProps/props';
import { addNotification } from '../../../../utils/AddNotification';
import { UserPermission } from '../../../../utils/UserPermission';
import { filteredList } from '../../../../utils/filterPermissionRoles';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../utils/redirectApp';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import ViewArea from '../../../settings/components/ViewArea';
import { CustomersProps } from './props';

const { SubMenu } = Menu;

const TabBillingHome = React.lazy(() => import('../../components/TabBillingHome'));
const TabAccounts = React.lazy(() => import('../../components/TabAccounts'));
const TabSetup = React.lazy(() => import('../../components/TabSetup'));
const TabCustomersSummary = React.lazy(() => import('../../components/TabCustomerSummary'));
const Customer = React.lazy(() => import('../../components/Customer'));

const Customers: FC<CustomersProps & I18nProps> = ({
    getTranslation,
    selectedWorkspace,
    loggedUser,
    match,
    history,
}) => {
    const [menuSelected, setMenuSelected] = useState<any>();
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const workspaceId = selectedWorkspace ? selectedWorkspace._id : undefined;
        if (!workspaceId) return;
        setCurrentWorkspaceId(workspaceId);
    }, [selectedWorkspace]);

    const location = useLocation();
    useEffect(() => {
        const path = location.pathname.split('/')[2];

        const existCustomer = getCustomerPath();

        if (!existCustomer) {
            const menu = menuList.map((group) => {
                return group.list.find((menu) => menu.ref === path);
            });

            setMenuSelected(menu.find((e) => e !== undefined) || menuList[0].list?.[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [match]);

    const getCustomerPath = () => {
        const { params }: any = match;

        const workspaceId = params.workspaceId;
        const accountId = params.accountId;
        if (workspaceId && accountId) {
            setMenuSelected({
                title: getTranslation('Billing'),
                component: Customer,
                ref: 'billing',
            });
            return true;
        }
        return false;
    };

    const menuList: MenuListGroup[] = [
        {
            title: getTranslation('Customers'),
            list: [
                {
                    title: getTranslation('Billing'),
                    component: TabBillingHome,
                    ref: 'billing',
                    href: '/customers/billing',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                    ],
                },
                {
                    title: getTranslation('Accounts'),
                    component: TabAccounts,
                    ref: 'accounts',
                    href: '/customers/accounts',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                    ],
                },
                {
                    title: getTranslation('Setup'),
                    component: TabSetup,
                    ref: 'setup',
                    href: '/customers/setup',
                    roles: [
                        {
                            resource: PermissionResources.ANY,
                            role: UserRoles.SYSTEM_ADMIN,
                        },
                    ],
                },
                {
                    title: getTranslation('Customer summary'),
                    href: getBaseUrl({
                        appTypePort: APP_TYPE_PORT.ADMIN,
                        pathname: 'admin/customers/customer-summary',
                    }),
                    isAbsolutePath: true,
                    component: TabCustomersSummary,
                    ref: 'admin/customers/customer-summary',
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
            ],
        },
    ];

    const sortedMenuList = filteredList(menuList, UserPermission);

    return (
        <MainMenu className='customers'>
            {menuSelected && (
                <>
                    <Wrapper width='200px' bgcolor='#fafafa' borderRight='1px #d0d0d091 solid' height='100vh'>
                        <Menu
                            defaultOpenKeys={['Customers']}
                            expandIcon
                            openKeys={['Customers']}
                            title={getTranslation('Customers')}
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
                                        key='Customers'
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
                                                    onClick={({ key }) => {
                                                        const item = menuList
                                                            .flatMap((menu) => menu?.list)
                                                            .find((menu) => menu?.ref === key);
                                                        setMenuSelected(item);
                                                    }}
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
        </MainMenu>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(withRouter(connect(mapStateToProps, null)(Customers)));
