import { Component } from 'react';
import { Constants } from '../../../../utils/Constants';
import { BotService } from '../../services/BotService';
import { MountWebchatProps, MountWebchatState } from './MountWebchatProps';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Channel, ChannelIdConfig, PermissionResources, UserRoles } from 'kissbot-core';
import './MountWebchat.scss';
import { UserPermission } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
declare var KissbotWidget: any;

class MountWebchatClass extends Component<MountWebchatProps & I18nProps, MountWebchatState> {
    constructor(props) {
        super(props);
        this.state = {
            showChannel: false,
            channel: undefined,
            demoUrl: '',
            infoModalData: '',
        };
    }

    componentWillMount() {
        this.getBotIntegrationTest();
    }

    loadLauncher = (callback) => {
        const existingScript = document.getElementById('kissbot-launcher');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = Constants.WEBCHAT_LAUNCHER_URL;
            document.body.appendChild(script);

            script.onload = () => {
                if (callback) callback();
            };
        }

        if (existingScript && callback) callback();
    };

    toggleShowChannel = (channel) => {
        const newChannel = this.state.channel ? undefined : channel;
        this.setState({
            ...this.state,
            channel: newChannel,
        });
    };

    createKeyEvent = (channel: Channel) => {
        window.addEventListener('keydown', (event) => {
            if (
                event &&
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() === 'l' &&
                !this.state.showChannel
            ) {
                if (
                    UserPermission.can([
                        {
                            role: UserRoles.SYSTEM_ADMIN,
                            resource: PermissionResources.ANY,
                            resourceId: undefined,
                        },
                        {
                            role: UserRoles.SYSTEM_UX_ADMIN,
                            resource: PermissionResources.ANY,
                        },
                        {
                            role: UserRoles.SYSTEM_CS_ADMIN,
                            resource: PermissionResources.ANY,
                        },
                    ])
                ) {
                    this.toggleShowChannel(channel);
                }
            }
        });
    };

    mountChat = (channel) => {
        try {
            if (KissbotWidget) {
                this.unmountChat();
            }
        } catch (error) {}

        this.createKeyEvent(channel);
        if (channel) {
            this.loadLauncher(() => {
                try {
                    KissbotWidget.mount({
                        channelConfigId: channel._id,
                        isTest: true,
                        attributes: {},
                    });
                } catch (error) {}
            });
        }
    };

    getBotIntegrationTest = async () => {
        const botId = this.props.match.params.botId;
        const channelConfig = await BotService.queryBotChannelConfig({
            channelId: ChannelIdConfig.webemulator,
            botId,
        });

        if (!channelConfig || channelConfig.length === 0) return;

        this.mountChat(channelConfig[0]);
    };

    unmountChat = () => {
        try {
            if (typeof KissbotWidget != undefined && typeof KissbotWidget != 'undefined') {
                KissbotWidget?.unmount();
            }
        } catch (error) {}
    };

    componentWillUnmount() {
        this.unmountChat();
    }

    getDemoToken = () => {
        const params: any = this.props.match.params;
        return Buffer.from(
            JSON.stringify({
                url: this.state.demoUrl,
                botId: params.botId,
                channelId: this.state.channel ? this.state.channel.token : '',
            })
        ).toString('base64');
    };

    render() {
        return null;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const MountWebchat = i18n(withRouter(connect(mapStateToProps, null)(MountWebchatClass)));
