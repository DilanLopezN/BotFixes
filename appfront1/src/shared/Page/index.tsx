import React, { FC, useEffect, useState } from 'react';
import {
    AiOutlineAppstore,
    AiOutlineComment,
    AiOutlineDatabase,
    AiOutlineHome,
    AiOutlineRobot,
    AiOutlineSetting,
    AiOutlineTeam,
    AiOutlineUser,
} from 'react-icons/ai';
import { BsBookmarksFill } from 'react-icons/bs';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { IconType } from 'react-icons/lib';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useRouteMatch } from 'react-router-dom';
import { StartBreakModal } from '../../components/start-break-modal';
import I18n from '../../modules/i18n/components/i18n';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import { LoginActions } from '../../modules/login/redux/actions';
import { addNotification } from '../../utils/AddNotification';
import {
    canViewCampaign,
    canViewSendingList,
    isAnySystemAdmin,
    isSystemAdmin,
    isSystemCsAdmin,
    isWorkspaceAdmin,
} from '../../utils/UserPermission';
import { APP_TYPE_PORT, redirectApp } from '../../utils/redirectApp';
import { TextLink } from '../TextLink/styled';
import ChangeWorkspace from '../change-workspace';
import { PageProps } from './props';
import {
    BottomLevelOptions,
    ChildArea,
    Content,
    ContentArea,
    LogoImage,
    LogoImageWrapper,
    OptionItem,
    SideMenu,
    TopLevelOptions,
} from './styles';

interface IOption {
    label: string;
    link?: string;
    icon: IconType;
    onClick?: () => void;
}

const Page: FC<PageProps & I18nProps> = ({ children, getTranslation, ...rest }) => {
    const match = useRouteMatch();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const getPath = () => {
        return match.path?.split('/')?.[1] ?? '';
    };

    const customerProps = (): Partial<IOption> => {
        if (isSystemAdmin(loggedUser)) {
            return {
                link: '/customers/billing',
            };
        }

        return {
            onClick: () => {
                window.location.pathname = '/admin/customers/customer-summary';
            },
        };
    };

    const [extensionSelected, setExtensionSelected] = useState<string>(getPath());
    const options: () => { [key: string]: IOption } = () => {
        let options: { [key: string]: IOption } = {
            'live-agent': {
                label: 'Attendances',
                link: '/live-agent',
                icon: AiOutlineComment,
            },
            dashboard: {
                label: 'Dashboard',
                link: '/dashboard/real-time',
                icon: () => {
                    return (
                        <svg
                            width='22px'
                            height='22px'
                            className='icon-menu'
                            viewBox='0 0 20 19'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M20 17.8379C20 18.3902 19.5523 18.8379 19 18.8379H1C0.44772 18.8379 0 18.3902 0 17.8379V1.83789C0 1.28561 0.44772 0.837891 1 0.837891H19C19.5523 0.837891 20 1.28561 20 1.83789V17.8379ZM9 12.8379H2V16.8379H9V12.8379ZM18 8.83789H11V16.8379H18V8.83789ZM9 2.83789H2V10.8379H9V2.83789ZM18 2.83789H11V6.83789H18V2.83789Z'
                                fill='white'
                            />
                        </svg>
                    );
                },
            },
            faq: {
                label: 'Faq',
                link: '/faq',
                icon: BsBookmarksFill,
            },
            entities: {
                label: 'Entities',
                link: '/entities',
                icon: AiOutlineDatabase,
            },
            settings: {
                label: 'Settings',
                link: '/settings',
                icon: AiOutlineSetting,
            },
            customers: {
                label: 'Customers',
                icon: AiOutlineTeam,
                ...customerProps(),
            },
            trainerBot: {
                label: 'Bot trainer',
                icon: AiOutlineRobot,
                onClick: () => {
                    redirectApp({ pathname: '/trainer-bot', appTypePort: APP_TYPE_PORT.V2 });
                },
            },
        };

        if (selectedWorkspace?.featureFlag?.enableModuleIntegrations || isAnySystemAdmin(loggedUser)) {
            options = {
                ...options,
                integrations: {
                    label: 'Integrations',
                    link: '/integrations',
                    icon: AiOutlineAppstore,
                },
            };
        }

        if (
            ((isSystemAdmin(loggedUser) || isSystemCsAdmin(loggedUser)) &&
                (selectedWorkspace?.featureFlag?.campaign || selectedWorkspace?.featureFlag?.activeMessage)) ||
            (isAnySystemAdmin(loggedUser) && selectedWorkspace?.featureFlag?.campaign) ||
            (isWorkspaceAdmin(loggedUser, selectedWorkspace?._id) && selectedWorkspace?.featureFlag?.campaign) ||
            (selectedWorkspace?.featureFlag?.campaign && canViewCampaign.can()) ||
            (selectedWorkspace?.featureFlag?.enableConfirmation && canViewSendingList.can())
        ) {
            options = {
                ...options,
                campaigns: {
                    label: 'Campaigns',
                    link: '/campaigns',
                    icon: () => {
                        return (
                            <svg
                                width='22px'
                                height='22px'
                                viewBox='0 0 22 19'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M21 0.837891C21.5523 0.837891 22 1.28561 22 1.83789V17.8445C22 18.3931 21.5447 18.8379 21.0082 18.8379H2.9918C2.44405 18.8379 2 18.393 2 17.8445V16.8379H20V5.13789L12 12.3379L2 3.33789V1.83789C2 1.28561 2.44772 0.837891 3 0.837891H21ZM8 12.8379V14.8379H0V12.8379H8ZM5 7.83789V9.83789H0V7.83789H5ZM19.5659 2.83789H4.43414L12 9.64719L19.5659 2.83789Z'
                                    fill='white'
                                />
                            </svg>
                        );
                    },
                },
            };
        }

        return options;
    };

    useEffect(() => {
        setExtensionSelected(getPath());
    }, []);

    const { settings } = useSelector((state: any) => state.loginReducer);
    const { errorMessages } = useSelector((state: any) => state.loginReducer);

    const dispatch = useDispatch();

    useEffect(() => {
        if (errorMessages?.length > 0) {
            errorMessages.forEach((current) => {
                addNotification({
                    title: current.title,
                    message: current.text,
                    type: current.type,
                    duration: current.duration,
                });
            });
            dispatch(LoginActions.removeError() as any);
        }
    }, [errorMessages]);

    const getOption = (extensionName: string) => {
        return options()[extensionName];
    };

    if (!settings?.layout) {
        return null;
    }

    return (
        <Content className={'Page ' + (rest.className || '')}>
            <ContentArea>
                <SideMenu style={{ background: settings.layout.color }}>
                    <TopLevelOptions>
                        <LogoImageWrapper>
                            <LogoImage title='Botdesigner' src='/assets/img/botdesigner-min-logo.png' />
                        </LogoImageWrapper>
                        <Link to='/home'>
                            <OptionItem selected={extensionSelected === 'home'} title={getTranslation('Home')}>
                                <AiOutlineHome className='icon-menu' />
                            </OptionItem>
                        </Link>
                        {settings.extensions
                            .filter((elem) => elem.enable && elem.hasPermission && options()[elem.extension])
                            .map((element, index) => {
                                const extension = getOption(element.extension);
                                const Icon = extension.icon;

                                const render = (
                                    <OptionItem
                                        key={element.extension}
                                        selected={extensionSelected === element.extension}
                                        title={getTranslation(extension.label)}
                                        tabIndex={-100 + index}
                                    >
                                        <Icon className='icon-menu' />
                                    </OptionItem>
                                );

                                if (extension.link) {
                                    return (
                                        <Link key={element.extension} to={extension.link}>
                                            {render}
                                        </Link>
                                    );
                                }

                                if (extension.onClick) {
                                    return (
                                        <TextLink key={element.extension} href='#' onClick={extension.onClick}>
                                            {render}
                                        </TextLink>
                                    );
                                }

                                return <React.Fragment key={element.extension}>{render}</React.Fragment>;
                            })}
                    </TopLevelOptions>
                    <BottomLevelOptions>
                        <OptionItem selected={false} className='beamerTrigger' title={getTranslation('Avisos')}>
                            <IoMdNotificationsOutline className='icon-menu' />
                        </OptionItem>
                        <TextLink
                            href={'https://botdesigner.freshdesk.com/support/solutions/69000392110'}
                            target={'_blank'}
                        >
                            <OptionItem selected={false} title={getTranslation('Help center')}>
                                <svg
                                    className='icon-menu'
                                    width='20'
                                    height='20'
                                    viewBox='0 0 20 20'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM9 14H11V16H9V14ZM10.61 4.04C8.55 3.74 6.73 5.01 6.18 6.83C6 7.41 6.44 8 7.05 8H7.25C7.66 8 7.99 7.71 8.13 7.33C8.45 6.44 9.4 5.83 10.43 6.05C11.38 6.25 12.08 7.18 12 8.15C11.9 9.49 10.38 9.78 9.55 11.03C9.55 11.04 9.54 11.04 9.54 11.05C9.53 11.07 9.52 11.08 9.51 11.1C9.42 11.25 9.33 11.42 9.26 11.6C9.25 11.63 9.23 11.65 9.22 11.68C9.21 11.7 9.21 11.72 9.2 11.75C9.08 12.09 9 12.5 9 13H11C11 12.58 11.11 12.23 11.28 11.93C11.3 11.9 11.31 11.87 11.33 11.84C11.41 11.7 11.51 11.57 11.61 11.45C11.62 11.44 11.63 11.42 11.64 11.41C11.74 11.29 11.85 11.18 11.97 11.07C12.93 10.16 14.23 9.42 13.96 7.51C13.72 5.77 12.35 4.3 10.61 4.04Z'
                                        fill='white'
                                    />
                                </svg>
                            </OptionItem>
                        </TextLink>
                        <ChangeWorkspace />

                        <Link to='/profile'>
                            <OptionItem selected={extensionSelected === 'profile'} title={getTranslation('Profile')}>
                                <AiOutlineUser className='icon-menu' />
                            </OptionItem>
                        </Link>
                        <StartBreakModal />
                    </BottomLevelOptions>
                </SideMenu>
                <ChildArea className='content' id='content-scroll'>
                    {children}
                </ChildArea>
            </ContentArea>
        </Content>
    );
};

export default I18n(Page) as FC<PageProps>;
