import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import Page from '../../../../shared/Page';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../utils/AddNotification';
import { Constants } from '../../../../utils/Constants';
import { Notifyer } from '../../../../utils/Notifyer';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import { SettingsService } from '../../../settings/service/SettingsService';
import { UserService } from '../../../settings/service/UserService';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { ChatContainer, ConversationContainer } from '../../components';
import { AudioPlayerProvider } from '../../components/AudioPlayer/context/audio-player.context';
import ChatContainerWithoutConversation from '../../components/ChatContainerWithoutConversation';
import { ConversationCardData } from '../../components/ConversationCard/props';
import { ConversationDetails } from '../../components/ConversationDetails';
import RestrictedAccess from '../../components/restricted-access';
import { ContactContextProvider } from '../../context/contact.context';
import { RemiOptimisticProvider } from '../../context/RemiOptimisticContext';
import { onBeforeUnload } from './before-unload';
import './LiveAgentChat.scss';
import { LiveAgentChatProps, LiveAgentChatState } from './props';

type Props = LiveAgentChatProps & I18nProps;

class LiveAgentChatClass extends Component<Props, LiveAgentChatState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            selectedConversation: undefined,
            readingMode: false,
            socketConnection: undefined,
            channelConfigList: [],
            teams: [],
        };
    }

    onConversationSelected = (conversation: ConversationCardData) => {
        const { selectedConversation } = this.state;

        if (JSON.stringify(selectedConversation) === JSON.stringify(conversation)) {
            return;
        }

        this.setState({
            selectedConversation: {
                ...conversation,
            },
        });
    };

    onUpdatedConversationSelected = (conversation: Partial<ConversationCardData>) => {
        const { selectedConversation } = this.state;

        if (!selectedConversation) {
            return;
        }

        const newSelectedConversation = {
            ...selectedConversation,
            ...conversation,
        };

        if (JSON.stringify(selectedConversation) === JSON.stringify(newSelectedConversation)) {
            return;
        }

        this.setState({
            selectedConversation: newSelectedConversation,
        });
    };

    queueLock: boolean = false;

    runGlobalEvents = () => {
        window.addEventListener('beforeunload', onBeforeUnload);
    };

    getChannels = async () => {
        const { selectedWorkspace } = this.props;
        if (!selectedWorkspace) {
            return;
        }

        const channelList = await ChannelConfigService.getChannelConfigList(selectedWorkspace._id);

        this.setState({
            channelConfigList: channelList,
        });
    };

    clearSavedMessages = () => {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);
    };

    getLoggedUser = async () => {
        const { loggedUser, selectedWorkspace } = this.props;
        if (!loggedUser._id || !selectedWorkspace?._id) {
            return;
        }
        return await UserService.authenticated(loggedUser._id as string, selectedWorkspace._id);
    };

    initSocket = async () => {
        const { selectedWorkspace } = this.props;
        const { socketConnection } = this.state;

        if (socketConnection) {
            socketConnection.close();
        }

        if (!selectedWorkspace) {
            return;
        }

        const loggedUser = await this.getLoggedUser();
        if (!loggedUser || !loggedUser.streamUrl) {
            return;
        }

        this.setState({
            socketConnection: io(loggedUser.streamUrl.streamUrl, {
                transports: ['websocket'],
                upgrade: false,
                timeout: 5000,
                
            }),
        });
    };

    componentDidMount() {
        this.preloadImages();
        const { selectedWorkspace } = this.props;

        if (!!selectedWorkspace && !selectedWorkspace.restrictedIp) {
            this.onWorkspaceLoad();
        }
    }

    componentDidUpdate(prevProps: any) {
        const { selectedWorkspace } = this.props;
        if (
            !!selectedWorkspace &&
            (!prevProps.selectedWorkspace || prevProps.selectedWorkspace._id !== selectedWorkspace._id) &&
            !selectedWorkspace.restrictedIp
        ) {
            this.onWorkspaceLoad();
        }
    }

    private onWorkspaceLoad() {
        this.runGlobalEvents();
        this.clearSavedMessages();

        this.initSocket();
        this.getChannels();
        this.getTeams();

        this.initNotification();
    }

    initNotification = async () => {
        try {
            await Notifyer.init();
        } catch (err) {
            console.log(err);
        }
    };

    getTeams = async () => {
        const { selectedWorkspace } = this.props;
        if (!selectedWorkspace) {
            return;
        }
        // projection esta limitando os campos que seram retornados da api
        const query = {
            projection: {
                _id: 1,
                name: 1,
                roleUsers: 1,
                requiredConversationCategorization: 1,
            },
        };
        const response = await SettingsService.getTeams(query, selectedWorkspace._id);

        if (!response?.data) {
            addNotification({
                title: this.props.getTranslation('An error has occurred'),
                message: this.props.getTranslation('There was an error loading the workspace teams. Refresh the page'),
                type: 'danger',
                duration: 4000,
            });
        }
        this.setState({
            teams: response?.data ?? [],
        });
    };

    componentWillUnmount() {
        const { settings } = this.props;
        const { socketConnection } = this.state;

        document.title = settings.layout.title;
        socketConnection?.close();
    }

    preloadImages = () => {
        const images = ['not_found.svg', 'bg-chat-compressed.jpg', 'loading.gif'];

        try {
            images.forEach((image) => {
                const img = new Image();
                img.src = `assets/img/${image}`;
            });
        } catch (error) {}
    };

    render() {
        const { loggedUser, selectedWorkspace, settings } = this.props;
        const { readingMode, selectedConversation, socketConnection, channelConfigList, teams } = this.state;
        const workspaceId = selectedWorkspace ? selectedWorkspace._id : undefined;

        return (
            <Page className='chat'>
                {!!selectedWorkspace ? (
                    selectedWorkspace.restrictedIp ? (
                        <RestrictedAccess />
                    ) : (
                        <Wrapper flexBox height='100vh'>
                            <RemiOptimisticProvider>
                                <ContactContextProvider>
                                    <AudioPlayerProvider>
                                        <ConversationContainer
                                            socketConnection={socketConnection}
                                            loggedUser={loggedUser}
                                            onConversationSelected={this.onConversationSelected}
                                            workspaceId={selectedWorkspace._id}
                                            addNotification={addNotification}
                                            conversation={selectedConversation}
                                            settings={settings}
                                            teams={teams}
                                            setSelectedWorkspace={this.props.setSelectedWorkspace}
                                            channelList={channelConfigList}
                                            onUpdatedConversationSelected={this.onUpdatedConversationSelected}
                                        />
                                        {!!selectedConversation ? (
                                            <ChatContainer
                                                teams={teams}
                                                socketConnection={socketConnection}
                                                key={`ChatContainer:${selectedConversation?._id}`}
                                                notification={addNotification}
                                                loggedUser={loggedUser}
                                                workspaceId={workspaceId}
                                                readingMode={readingMode}
                                                conversation={selectedConversation}
                                                channelList={channelConfigList}
                                                onUpdatedConversationSelected={this.onUpdatedConversationSelected}
                                            />
                                        ) : (
                                            <ChatContainerWithoutConversation />
                                        )}
                                    </AudioPlayerProvider>
                                    {!!selectedConversation && (
                                        <ConversationDetails
                                            teams={teams}
                                            selectedConversation={selectedConversation}
                                            onConversationSelected={this.onConversationSelected}
                                            workspaceId={selectedWorkspace._id}
                                            notification={addNotification}
                                            readingMode={readingMode}
                                            socketConnection={socketConnection}
                                            loggedUser={loggedUser}
                                            channelList={channelConfigList}
                                        />
                                    )}
                                </ContactContextProvider>
                            </RemiOptimisticProvider>
                        </Wrapper>
                    )
                ) : null}
            </Page>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    settings: state.loginReducer.settings,
});

export const LiveAgentChat = I18n(
    withRouter(
        connect(mapStateToProps, {
            setSelectedWorkspace: WorkspaceActions.setSelectedWorkspace,
        })(LiveAgentChatClass)
    )
);
