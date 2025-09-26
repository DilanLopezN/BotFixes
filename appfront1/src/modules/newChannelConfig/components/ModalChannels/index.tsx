import React, { FC, useState, useEffect } from 'react'
import { Wrapper, PrimaryButton } from '../../../../ui-kissbot-v2/common'
import { ModalChannelsProps } from './props'
import ClickOutside from 'react-click-outside'
import ChannelsMenu from '../ChannelsMenu';
import I18n from '../../../i18n/components/i18n';
import { OptionsMenuChannel } from '../ChannelsMenu/props';
import TabGeneralChannel from '../TabGeneralChannel';
import { ViewArea, Container } from './styled';
import { ChannelConfig } from '../../../../model/Bot';
import TabAppearance from '../TabAppearance';
import Loader from '../../../../shared/loader';
import { Formik } from 'formik';
import { Constants } from '../../../../utils/Constants';
import { ChannelIdConfig } from 'kissbot-core';
import { connect } from 'react-redux';
import { BotActions } from '../../../bot/redux/actions';
import merge from 'lodash/merge';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { ModalConfirm } from '../../../../shared/ModalConfirm/ModalConfirm';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import TabBot from '../TabBot';
import TabGupshup from '../TabGupshup';
import { ChannelConfigService } from '../../service/ChannelConfigService';
import styled from 'styled-components';
import { timeout } from '../../../../utils/Timer';
import TabTelegram from '../TabTelegram';

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        height: 7px;
        width: 7px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background :rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;


const ModalChannels: FC<ModalChannelsProps> = (props) => {
    const {
        opened,
        channelConfigId,
        onClose,
        getTranslation,
        addNotification,
        updateChannel,
        channelList,
        deleteChannelConfig,
    } = props;

    const options: OptionsMenuChannel[] = [
        {
            label: getTranslation('General'),
            ref: 'general',
            component: TabGeneralChannel,
            showOnChannelIdEquals: [...Object.values(ChannelIdConfig)],
            sections: [
                {
                    ref: 'general',
                    showOnChannelIdEquals: [...Object.values(ChannelIdConfig)]
                },
                {
                    ref: 'installation',
                    showOnChannelIdEquals: [ChannelIdConfig.webchat]
                }, {
                    ref: 'endMessage',
                    showOnChannelIdEquals: [...Object.values(ChannelIdConfig)]
                }
            ]
        },
        {
            label: getTranslation('Appearance'),
            ref: 'appearance',
            component: TabAppearance,
            showOnChannelIdEquals: [
                ChannelIdConfig.webchat,
                ChannelIdConfig.webemulator,
            ],
            sections: [
                {
                    ref: 'definitions',
                    showOnChannelIdEquals: [
                        ChannelIdConfig.webchat,
                        ChannelIdConfig.webemulator,
                    ]
                },
                {
                    ref: 'behavior',
                    showOnChannelIdEquals: [
                        ChannelIdConfig.webchat,
                        ChannelIdConfig.webemulator,
                    ]
                }
            ]
        },
        {
            label: getTranslation('Bot'),
            ref: 'bot',
            component: TabBot,
            showOnChannelIdEquals: [...Object.values(ChannelIdConfig)],
            sections: [
                {
                    ref: 'botVincule',
                    showOnChannelIdEquals: [...Object.values(ChannelIdConfig)],
                }
            ]
        },
        {
            label: 'Whatsapp',
            ref: 'gupshup',
            component: TabGupshup,
            showOnChannelIdEquals: [ChannelIdConfig.gupshup],
            sections: [
                {
                    ref: 'configuration',
                    showOnChannelIdEquals: [ChannelIdConfig.gupshup]
                }
            ]
        },
        {
            label: 'Telegram',
            ref: 'telegram',
            component: TabTelegram,
            showOnChannelIdEquals: [ChannelIdConfig.telegram],
            sections: [
                {
                    ref: 'configuration',
                    showOnChannelIdEquals: [ChannelIdConfig.telegram]
                }
            ]
        }
    ];

    const [state, setstate] = useState(opened);
    const [saving, setSaving] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<OptionsMenuChannel>(options[0]);
    const [channel, setChannel] = useState<ChannelConfig | undefined>(undefined);
    const [delChannel, setDelChannel] = useState<boolean>(false);
    const [file, setFile] = useState<any>(undefined);

    const setClosed = () => {
        timeout(onClose, 300);
        setstate(false);
    }

    useEffect(() => {
        getChannel()
        updateRecently()
    }, [])

    useEffect(() => {
        updateChannelFromRedux()
    }, [channelList])

    const updateChannelFromRedux = () => {
        if (!channel) return;

        const findedChannel = channelList.find(currChannel => channel._id == currChannel._id);
        setChannel(findedChannel)
    }

    const updateRecently = () => {
        try {
            const saved = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_CHANNELS);
            if (saved && typeof saved === 'string') {
                const parsed = JSON.parse(saved);
                const existChannelId = parsed.items.find((chConfigId: string) => chConfigId === channelConfigId)
                if (existChannelId)
                    parsed.items = parsed.items.filter(ch => ch !== channelConfigId);

                parsed.items.push(channelConfigId);
                localStorage.setItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_CHANNELS, JSON.stringify(parsed))
            } else {
                localStorage.setItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_CHANNELS, JSON.stringify({
                    items: [channelConfigId]
                }))
            }
        } catch (error) {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_CHANNELS);
        }
    }

    const getChannel = async () => {
        const channel = await ChannelConfigService.getChannelConfig(channelConfigId);
        if (channel && channel.length > 0)
            setChannel(channel[0])
    }

    const Component = selectedMenu.component as Function;

    const updateChannelConfig = async () => {
        setSaving(true);

        if (!channel) return;
        let error: any;

        let newChannel = {...channel};
        if (
            (channel.channelId === ChannelIdConfig.webchat || channel.channelId === ChannelIdConfig.webemulator) &&
            file
        ) {
            const formData = new FormData()
            formData.append('attachment', file)

            const url = await ChannelConfigService.updateChannelConfigAvatar(
                channel._id as string,
                formData,
                (err) => {
                    error = err;
                }
            );

            if (url) {
                newChannel.configData.avatar = url;
            }
        }

        const channelUpdated = await ChannelConfigService.updateChannelConfig(newChannel, (err) => {
            error = err;
        })

        setSaving(false)

        if (error)
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again')
            })

        updateChannel(channelUpdated);

        return addNotification({
            type: 'success',
            duration: 3000,
            title: getTranslation('Channel updated successfully'),
            message: getTranslation('Channel updated successfully')
        })
    }

    const deleteChannel = async () => {
        if (!channel) return;
        let error: any;
        setSaving(true);

        const deletedChannel = await ChannelConfigService.deleteChannelConfig(channelConfigId, (err) => {
            error = err;
        });

        if (error || !deletedChannel.deleted)
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again')
            })

        setSaving(false)
        setClosed()
        deleteChannelConfig(channelConfigId)

        return addNotification({
            type: 'success',
            duration: 3000,
            title: getTranslation('Channel deleted successfully'),
            message: getTranslation('Channel deleted successfully')
        })
    }

    const initialValues = () => {
        const channelInitial: any = {
            configData: {
                startChatOnLoad: false,
                chatTitle: '',
                startWithConfirmation: false,
            },
            attendancePeriods: {
                mon: [],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: [],
                sun: [],
            },
            expirationTime: {}
        };
        return { channel: merge(channelInitial, channel) };
    }

    const canDeleteChannel = () => {
        const channelsToIgnoreDelete = [ChannelIdConfig.webemulator];
        return channel && !channelsToIgnoreDelete.includes(channel.channelId);
    }

    return <>
        <ModalConfirm
            isOpened={delChannel}
            onAction={(action) => {
                if (action)
                    deleteChannel()
                setDelChannel(false)
            }}
        >
            <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
            <p style={{ margin: '10px 0px 17px' }}>{getTranslation('Are you sure you want to delete the channel? The action cannot be undone')}</p>
        </ModalConfirm>

        <ViewArea
            right='0'
            left='0'
            className='ModalChannel'
            height='100%'
            bgcolor='#0000001a'
            position='absolute' />

        <ClickOutside
            onClickOutside={(event) => {
                if (event
                    && event.target
                    && event.target?.className?.indexOf?.('ModalChannel') === -1) return null;
                setClosed()
            }}>
            <Container
                className={!state ? ' closing ' : ''}
            >
                {saving
                    && <Wrapper
                        right='0'
                        left='0'
                        top='0'
                        height='100%'
                        flexBox
                        justifyContent='center'
                        bottom='0'
                        bgcolor='#9292921f'
                        position='absolute'>
                        <Loader size={50} />
                    </Wrapper>}
                {channel
                    ? <>
                        <Wrapper
                            bgcolor='#FFF'
                            height='50px'
                            flexBox
                            alignItems='center'
                            justifyContent='space-between'
                            padding='0 30px 0 15px'
                        >
                            <Wrapper
                                flexBox
                                alignItems='center'>
                                <Wrapper
                                    flexBox
                                    cursor='pointer'
                                    alignItems='center'>
                                    <span className="mdi mdi-24px mdi-close" onClick={setClosed} />
                                </Wrapper>
                                <Wrapper
                                    padding='0 0 0 15px'
                                    fontSize='13pt'>
                                    {`${channel.name} - ${channel.channelId}`}
                                </Wrapper>
                            </Wrapper>

                            <Wrapper
                                flexBox
                                alignItems='center'>
                                {canDeleteChannel()
                                    && <PrimaryButton
                                        margin='0 7px 0 0'
                                        onClick={() => setDelChannel(true)}
                                        colorType={ColorType.danger}
                                        width='70px'>
                                        {getTranslation('Delete')}
                                    </PrimaryButton>}
                                <PrimaryButton
                                    onClick={() => updateChannelConfig()}
                                    width='70px'>
                                    {getTranslation('Save')}
                                </PrimaryButton>
                            </Wrapper>
                        </Wrapper>
                        <ChannelsMenu
                            options={options}
                            selected={selectedMenu}
                            channelId={channel.channelId}
                            onSelect={(option: OptionsMenuChannel) => setSelectedMenu(option)}
                        />
                        <Scroll
                            overflowX='auto'
                            height='calc(100% - 110px)'>
                            {channel
                                ? <Formik
                                    initialValues={{ ...initialValues() }}
                                    onSubmit={() => { }}
                                    render={(props) => (
                                        <Wrapper
                                            padding='20px 25px'>
                                            <Component
                                                channel={channel}
                                                {...props}
                                                setFile={value => setFile(value)}
                                                selectedMenu={selectedMenu}
                                                addNotification={addNotification}
                                                onChange={(channel) => {
                                                    setChannel(channel)
                                                }} />
                                        </Wrapper>
                                    )} />
                                : <Loader />}
                        </Scroll>
                    </>
                    : null}
            </Container>
        </ClickOutside>
    </>
}


const mapStateToProps = (state: any, ownProps: any) => ({
    channelList: state.botReducer.channelList,
})

const mapDispatchToProps = (dispatch, ownProps) => {
    const actions = {};

    if (ownProps.referencePage === 'workspace') {
        actions['updateChannel'] = WorkspaceActions.updateChannel
        actions['deleteChannel'] = WorkspaceActions.deleteChannel
    } else if (ownProps.referencePage === 'bot') {
        actions['updateChannel'] = BotActions.updateChannel
        actions['deleteChannel'] = BotActions.deleteChannel
    }

    return {
        updateChannel: (props) => {
            dispatch(actions['updateChannel'](props));
        },
        deleteChannelConfig: (props) => {
            dispatch(actions['deleteChannel'](props));
        }
    };
};

export default I18n(connect(
    mapStateToProps,
    mapDispatchToProps
)(ModalChannels));

