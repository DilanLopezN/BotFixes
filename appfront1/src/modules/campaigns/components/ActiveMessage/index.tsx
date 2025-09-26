import { FC, useCallback, useEffect, useState } from 'react';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActiveMessageProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { useParams, withRouter } from 'react-router-dom';
import { ScrollView } from '../../../settings/components/ScrollView';
import Header from '../../../../shared-v2/Header/Header';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ActiveMessageSetting } from '../../interfaces/active-message-setting-dto';
import { ChannelConfig } from '../../../../model/Bot';
import { CampaignsService } from '../../service/CampaignsService';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import ActiveMessageList from './components/ActiveMessageList';
import EditActiveMessage from './components/EditActiveMessage';
import { timeout } from '../../../../utils/Timer';
import { ChannelIdConfig } from 'kissbot-core';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { ComponentManagerEnum } from '../../../settings/interfaces/component-manager.enum';
import { TextLink } from '../../../../shared/TextLink/styled';

const channelConfigValidActiveMessage = [ChannelIdConfig.whatsapp, ChannelIdConfig.whatsweb, ChannelIdConfig.gupshup];

const ActiveMessage: FC<ActiveMessageProps & I18nProps> = ({
    loggedUser,
    addNotification,
    getTranslation,
    match,
    history,
    workspaceId,
    location,
    workspaceChannelList,
    setWorkspaceChannelList,
}) => {
    const getInitialComponent = useCallback(() => {
        const query = new URLSearchParams(location.search);

        if (!!query.get('activeMessage')) {
            return ComponentManagerEnum.UPDATE_FORM;
        }
        return ComponentManagerEnum.LIST;
    }, [location.search]);
    const { activeMessageId } = useParams<{ activeMessageId?: string }>();
    const [currentComponent, setCurrentComponent] = useState<ComponentManagerEnum>(getInitialComponent());
    const [currentActiveMessage, setCurrentActiveMessage] = useState<ActiveMessageSetting | undefined>(undefined);
    const [channelList, setChannelList] = useState<ChannelConfig[]>(workspaceChannelList || []);
    const [workspaceActiveMessage, setWorkspaceActiveMessage] = useState<ActiveMessageSetting[]>([]);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);

    const handleBackToListClick = (event?): void => {
        event?.preventDefault();
        setCurrentActiveMessage(undefined);
        setCurrentComponent(ComponentManagerEnum.LIST);
        history.push(`/campaigns/active-message-settings`);
    };

    const handleActiveMessageCreation = (): void => {
        setCurrentActiveMessage(undefined);
        setLoadingRequest(false);
        setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
    };

    const onCreatedActiveMessage = () => {
        setCurrentComponent(ComponentManagerEnum.LIST);
        setLoading(true);
    };

    const onUpdatedActiveMessage = () => {
        history.push(`/campaigns/active-message-settings`);
        setCurrentActiveMessage(undefined);
        setCurrentComponent(ComponentManagerEnum.LIST);
        setLoading(true);
        setLoadingRequest(false);
    };

    const onEditActiveMessage = (activeMessageId: string) => {
        const currActiveMessage: any = workspaceActiveMessage.find(
            (activeMessage) => activeMessage.id === activeMessageId
        );

        if (currActiveMessage) {
            history.push(`/campaigns/active-message-settings/${activeMessageId}`);
        }
    };

    const onDeletedActiveMessage = (activeMessageId: string) => {
        const newActiveMessages = workspaceActiveMessage.filter(
            (activeMessage) => activeMessage.id !== activeMessageId
        );
        setWorkspaceActiveMessage(newActiveMessages);

        if (currentComponent === ComponentManagerEnum.UPDATE_FORM) {
            handleBackToListClick();
        }
    };

    const getActiveMessageById = async (activeMessageId) => {
        const activeMessage = await CampaignsService.getOneActiveMessage(workspaceId, activeMessageId);

        let responseChannelConfig;
        if (workspaceChannelList?.length) {
            responseChannelConfig = workspaceChannelList;
        } else {
            setWorkspaceChannelList(workspaceId);
        }

        if (!activeMessage && !responseChannelConfig) {
            setCurrentActiveMessage(undefined);
            return history.push(`/campaigns/active-message-settings`);
        }
        setLoadingRequest(false);
        validChannelConfigForActiveMessage(responseChannelConfig);
        setCurrentActiveMessage(activeMessage);
    };

    const getWorkspaceActiveMessage = async () => {
        const responseActiveMessage = await CampaignsService.getActiveMessages(workspaceId);

        let responseChannelConfig;
        if (workspaceChannelList?.length) {
            responseChannelConfig = workspaceChannelList;
        } else {
            setWorkspaceChannelList(workspaceId);
        }

        if (responseChannelConfig) {
            validChannelConfigForActiveMessage(responseChannelConfig);
        }

        if (responseActiveMessage?.length) {
            setWorkspaceActiveMessage(responseActiveMessage);
        }

        timeout(() => setLoading(false), 100);
    };

    const validChannelConfigForActiveMessage = (channels: ChannelConfig[]) => {
        if (channels) {
            const list = channels.filter(
                (channel) =>
                    channel.channelId ===
                    channelConfigValidActiveMessage.find((element) => element === channel.channelId)
            );

            setChannelList(list);
        }
    };

    const filterchannelSelected = () => {
        return channelList.filter((channel) => channel.channelId === ChannelIdConfig.gupshup);
    };

    useEffect(() => {
        if (activeMessageId) {
            getActiveMessageById(activeMessageId);
            setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
        } else {
            setCurrentComponent(ComponentManagerEnum.LIST);
        }
    }, [activeMessageId]);

    useEffect(() => {
        if (currentComponent === ComponentManagerEnum.LIST) {
            getWorkspaceActiveMessage();
        }
    }, [workspaceId, currentComponent]);

    useEffect(() => {
        if (workspaceChannelList?.length) {
            validChannelConfigForActiveMessage(workspaceChannelList);
        }
    }, [workspaceChannelList]);

    return (
        <>
            <Wrapper>
                <Header
                    title={
                        currentActiveMessage?.channelConfigToken ? (
                            <div style={{ display: 'flex' }}>
                                <TextLink style={{ whiteSpace: 'nowrap' }} href='#' onClick={handleBackToListClick}>
                                    {getTranslation('Integration active message')}
                                </TextLink>
                                <div style={{ margin: '0 7px' }}>{' / '}</div>
                                <div
                                    style={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: '-15px',
                                    }}
                                >
                                    {currentActiveMessage?.settingName ||
                                        channelList.find(
                                            (channel) => channel.token === currentActiveMessage.channelConfigToken
                                        )?.name}
                                </div>
                            </div>
                        ) : (
                            getTranslation('Integration active message')
                        )
                    }
                    action={
                        currentComponent === ComponentManagerEnum.LIST && filterchannelSelected().length ? (
                            <PrimaryButton onClick={() => handleActiveMessageCreation()}>
                                {getTranslation('Add')}
                            </PrimaryButton>
                        ) : undefined
                    }
                ></Header>
            </Wrapper>
            <ScrollView id='content-active-message'>
                <Wrapper margin='0 auto' maxWidth='1100px' padding={'20px 30px'}>
                    {currentComponent === ComponentManagerEnum.LIST && (
                        <ActiveMessageList
                            addNotification={addNotification}
                            workspaceId={workspaceId}
                            loading={loading}
                            workspaceActiveMessage={workspaceActiveMessage}
                            workspaceChannels={channelList}
                            onDeletedActiveMessage={onDeletedActiveMessage}
                            onEditActiveMessage={onEditActiveMessage}
                        />
                    )}
                    {currentComponent === ComponentManagerEnum.UPDATE_FORM && loggedUser?._id && (
                        <EditActiveMessage
                            onUpdatedActiveMessage={onUpdatedActiveMessage}
                            onCreatedActiveMessage={onCreatedActiveMessage}
                            activeMessage={currentActiveMessage}
                            onCancel={handleBackToListClick}
                            addNotification={addNotification}
                            workspaceId={workspaceId}
                            onDeletedActiveMessage={onDeletedActiveMessage}
                            loadingRequest={loadingRequest}
                            editing={location.search ? true : false}
                            channelList={filterchannelSelected()}
                        />
                    )}
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    workspaceChannelList: state.workspaceReducer.channelList,
});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setWorkspaceChannelList: WorkspaceActions.setChannelList,
        })(ActiveMessage)
    )
);
