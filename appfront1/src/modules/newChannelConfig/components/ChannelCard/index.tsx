import { FC, useState } from 'react';
import { Wrapper, PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { ChannelCardProps } from './props';
import styled from 'styled-components';
import './style.scss';
import { withRouter } from 'react-router-dom';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { v4 } from 'uuid';
import { BotActions } from '../../../bot/redux/actions';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { ChannelConfigService } from '../../service/ChannelConfigService';
import { timeout } from '../../../../utils/Timer';
import Copy from '../../../../shared/Copy';

const Icon = styled.span`
    :before {
        font-size: 70px;
    }
`;

const CustomScroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        height: 0px;
        width: 0px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;

const ChannelCard: FC<ChannelCardProps> = (props) => {
    const {
        title,
        description,
        list,
        channelId,
        openModal,
        match,
        addNotification,
        getTranslation,
        mdi,
        multiple,
        addChannel,
    } = props;

    const { workspaceId, botId } = match.params;

    const [opened, setopened] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState({});

    const createChannel = async () => {
        const channel: any = {
            channelId,
            configData: {},
            name: `${channelId}-default`,
            enable: true,
            keepLive: true,
            workspaceId,
            token: v4(),
            attendancePeriods: {
                mon: [],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: [],
                sun: [],
            },
            expirationTime: {},
        };

        if (botId) channel.botId = botId;

        let error: any;

        const channelCreated: any = await ChannelConfigService.createChannelConfig(channel, (err) => {
            error = err;
        });

        if (error && error.error) {
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        } else {
            addChannel(channelCreated);
            timeout(() => openModal(channelCreated._id), 200);
        }
    };

    const handleCopyLink = (phonenumber, index) => {
        const link = `https://api.whatsapp.com/send?phone=${phonenumber}`;
        navigator.clipboard.writeText(link);
        setIsCopied({ ...isCopied, [index]: true });
    };

    return (
        <Wrapper
            className='ChannelCard'
            boxShadow='1px #d0d0d091 solid'
            padding='10px 20px 10px 20px'
            bgcolor='#FFF'
            borderRadius='10px'
            maxWidth='315px'
            minWidth='270px'
            height='300px'
            minHeight='290px'
            margin='15px 15px'
            flex
        >
            {!opened ? (
                <Wrapper flexBox justifyContent='space-between' height='100%' flexDirection='column'>
                    <Wrapper flexBox>
                        <Icon className={`mdi mdi-70px mdi-${mdi}`} />
                    </Wrapper>
                    <Wrapper color='#666' fontSize='17px' margin='0 0 15px 0' fontWeight='600'>
                        {title}
                    </Wrapper>
                    <Wrapper color='#777' height='100px'>
                        {description}
                    </Wrapper>
                    <Wrapper flexBox cursor='pointer' justifyContent='flex-end'>
                        <span
                            className='mdi mdi-24px mdi-arrow-right'
                            onClick={() => {
                                if (multiple || list.length > 1) setopened(true);
                                else if (list.length === 1) openModal(list[0]._id);
                            }}
                        />
                    </Wrapper>
                </Wrapper>
            ) : (
                <Wrapper flex>
                    <Wrapper flexBox justifyContent='space-between' cursor='pointer' alignItems='center'>
                        <Wrapper flexBox alignItems='center'>
                            <span className='mdi mdi-24px mdi-arrow-left' onClick={() => setopened(false)} />
                            <Wrapper fontWeight='600' fontSize='15px' margin='0 0 0 20px'>
                                <Wrapper>{title}</Wrapper>
                            </Wrapper>
                        </Wrapper>
                        <Wrapper>
                            <span className='mdi mdi-24px mdi-plus-circle-outline' onClick={createChannel} />
                        </Wrapper>
                    </Wrapper>
                    <CustomScroll overflowY='auto' maxHeight='224px' margin='14px 0 0 0 '>
                        {list && list.length > 0 ? (
                            list.map((channel, index) => (
                                <Wrapper
                                    key={`card:${channel._id}`}
                                    margin='0 0 5px 0'
                                    justifyContent='space-between'
                                    fontSize='15px'
                                    flexBox
                                >
                                    <Wrapper maxWidth='200px' minWidth='190px'>
                                        {channel.name}
                                    </Wrapper>
                                    <>
                                        <Wrapper display='flex' cursor='pointer'>
                                            {channel.channelId === 'whatsapp-gupshup' &&
                                                channel.configData &&
                                                channel.configData.phoneNumber && (
                                                    <Copy
                                                        id='copy'
                                                        title={getTranslation('Copy')}
                                                        duration={1000}
                                                        placement={'topRight'}
                                                        onClick={() => {
                                                            handleCopyLink(channel.configData.phoneNumber, index);
                                                        }}
                                                        className='mdi mdi-12px mdi-content-copy'
                                                        style={{
                                                            cursor: 'pointer',
                                                            fontSize: '15px',
                                                        }}
                                                    />
                                                )}
                                            <Wrapper cursor='pointer' padding='0 0 0 4px'>
                                                <span
                                                    className='mdi mdi-12px mdi-pencil'
                                                    onClick={() => {
                                                        openModal(channel._id);
                                                    }}
                                                />
                                            </Wrapper>
                                        </Wrapper>
                                    </>
                                </Wrapper>
                            ))
                        ) : (
                            <Wrapper margin='10px 0'>
                                <Wrapper textAlign='center'>{getTranslation('No channels registered')}</Wrapper>
                                <Wrapper flexBox margin='10px 0' justifyContent='center'>
                                    <PrimaryButton width='80px' onClick={createChannel}>
                                        {getTranslation('Create now')}
                                    </PrimaryButton>
                                </Wrapper>
                            </Wrapper>
                        )}
                    </CustomScroll>
                </Wrapper>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({});

const mapDispatchToProps = (dispatch, ownProps) => {
    const actions = {};

    if (ownProps.referencePage === 'workspace') {
        actions['addChannel'] = WorkspaceActions.addChannel;
    } else if (ownProps.referencePage === 'bot') {
        actions['addChannel'] = BotActions.addChannel;
    }

    return {
        addChannel: (props) => {
            dispatch(actions['addChannel'](props));
        },
    };
};

export default I18n(withRouter(connect(mapStateToProps, mapDispatchToProps)(ChannelCard)));
