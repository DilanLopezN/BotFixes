import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Wrapper } from '../../ui-kissbot-v2/common';
import { ChannelConfigProps } from './props';
import I18n from '../i18n/components/i18n';
import BotConfigView from './components/BotConfigView';
import ChannelList from './components/ChannelList';
import { BotActions } from '../bot/redux/actions';
import { WorkspaceActions } from '../workspace/redux/actions';
import { addNotification } from '../../utils/AddNotification';
import { MainMenu } from '../../shared/MainMenu/styles';
import { MenuListGroup } from '../../ui-kissbot-v2/common/MenuProps/props';
import AttributesList from './components/AttributesList';
import { BotService } from '../bot/services/BotService';
import { StyledNavLink } from '../integrations/pages/health/styles';
import { Menu } from 'antd';
const { SubMenu } = Menu;

const ChannelConfig: FC<ChannelConfigProps> = (props) => {
    const { getTranslation, setChannelList, setCurrentBot, match, history, setWorkspaceChannelList } = props;
    const { botId, workspaceId, category } = match.params;

    const [menuSelected, setMenuSelected] = useState<any>(undefined);
    const [referencePage, setReferencePage] = useState<string | undefined>(undefined);
    const location = useLocation();

    const menuList: MenuListGroup[] = [
        {
            title: getTranslation('Configurations'),
            list: [
                {
                    title: getTranslation('Channels'),
                    component: ChannelList,
                    ref: 'channels',
                    showOnRefPageIs: ['bot'],
                },
                {
                    title: getTranslation('Attributes'),
                    component: AttributesList,
                    ref: 'attributes',
                    showOnRefPageIs: ['bot'],
                },
            ],
        },
    ];

    useEffect(() => {
        loadReferencePage();
    }, []);

    useEffect(() => {
        if (referencePage) {
            if (referencePage === 'bot') {
                loadBot();
            } else if (referencePage === 'workspace') {
                loadWorkspaceChannels();
            }
            loadMenuOption();
        }
    }, [referencePage, category]);

    const loadReferencePage = () => {
        if (workspaceId && botId) {
            setReferencePage('bot');
        } else if (workspaceId && !botId) {
            setReferencePage('workspace');
        }
    };

    const loadWorkspaceChannels = () => setWorkspaceChannelList(workspaceId);
    const loadMenuOption = () => {
        if (!referencePage) return;

        const listMenu = menuList.flatMap((group) => group.list);
        const filteredList = listMenu.filter((item) => item.showOnRefPageIs?.includes(referencePage));

        if (!category) {
            if (referencePage === 'workspace')
                return history.push(`/workspace/${workspaceId}/bot/${botId}/settings/${filteredList[0]?.ref}`);
            else if (referencePage === 'bot')
                history.push(`/workspace/${workspaceId}/bot/${botId}/settings/${filteredList[0]?.ref}`);
        } else {
            const found = filteredList.find((el) => el.ref === category.toLowerCase());
            if (found) {
                setMenuSelected(found);
            } else {
                history.push(`/workspace/${workspaceId}/bot/${botId}/settings/${filteredList[0]?.ref}`);
            }
        }
    };

    const loadBot = async () => {
        const bot = await BotService.getBot(workspaceId, botId);
        setCurrentBot(bot);
        setChannelList(bot._id);
    };

    return (
        <MainMenu className='botSettings'>
            {!menuSelected || !referencePage ? null : (
                <>
                    <Wrapper width='200px' height='100vh' borderRight='1px #d0d0d091 solid'>
                        <Menu
                            defaultOpenKeys={['Configurations']}
                            expandIcon
                            openKeys={['Configurations']}
                            mode='inline'
                            title={getTranslation('Configurations')}
                            selectedKeys={[location.pathname]}
                            onSelect={({ key }) => history.push(key)}
                            style={{
                                height: '100%',
                                width: '100%',
                                backgroundColor: '#fafafa',
                            }}
                        >
                            {menuList.map((group) => (
                                <SubMenu
                                    className='menu-antd'
                                    key={'Configurations'}
                                    title={
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {group.title}
                                        </span>
                                    }
                                >
                                    {group.list.map((item) => (
                                        <Menu.Item
                                            className={menuSelected?.ref === item.ref ? 'ant-menu-item-selected' : ''}
                                            title={item.title}
                                            style={{ paddingLeft: '24px' }}
                                            key={`${item.ref}`}
                                        >
                                            <StyledNavLink to={`${item.ref}`} exact>
                                                {item.title}
                                            </StyledNavLink>
                                        </Menu.Item>
                                    ))}
                                </SubMenu>
                            ))}
                        </Menu>
                    </Wrapper>
                    <Wrapper overflowY={'hidden'} height='100vh' flex>
                        {menuSelected && referencePage && (
                            <Wrapper overflowY={'hidden'} height='100vh' flex>
                                <BotConfigView
                                    referencePage={referencePage}
                                    addNotification={addNotification}
                                    menuSelected={menuSelected}
                                />
                            </Wrapper>
                        )}
                    </Wrapper>
                </>
            )}
        </MainMenu>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentBot: BotActions.setCurrentBot,
            setChannelList: BotActions.setChannelList,
            setWorkspaceChannelList: WorkspaceActions.setChannelList,
        })(ChannelConfig)
    )
);
