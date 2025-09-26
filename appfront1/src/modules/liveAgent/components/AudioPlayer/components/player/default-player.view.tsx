import { Col, Divider, Dropdown, Row, Slider, Typography } from 'antd';
import { FC, useContext, useEffect, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import LoadingDots from '../../../../../../shared-v2/LoadingDots';
import { AudioTranscription } from '../../../../../../ui-kissbot-v2/interfaces/audio-transcription';
import { addNotification } from '../../../../../../utils/AddNotification';
import { useLanguageContext } from '../../../../../i18n/context';
import { useMessageOptions } from '../../../../hooks/use-message-options/use-message-options';
import { LiveAgentService } from '../../../../service/LiveAgent.service';
import { AudioPlayerContext } from '../../context/audio-player.context';
import { secondsToHms } from '../../format-time';
import { PlayerContainerProps, PlayerViewProps } from './props';
import { isAnySystemAdmin, isUserAgent, isWorkspaceAdmin } from '../../../../../../utils/UserPermission';

const FlexContainer = styled.div`
    display: flex;
    align-items: center;
    width: 40px;
    justify-content: center;
`;

const PlaybackRateButton = styled.button`
    background: #128c7e;
    color: #ffffff;
    font-weight: 700;
    width: 45px;
    border-radius: 5px;
`;

const CircleBackground = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    border-radius: 50%;
    background-color: #128c7e;
    cursor: pointer;
`;

const PauseIcon = styled(FaPause)`
    font-size: 1rem;
    color: #ffffff;
    cursor: pointer;
`;

const PlayIcon = styled(FaPlay)`
    font-size: 1rem;
    margin-left: 2px;
    color: #ffffff;
    cursor: pointer;
`;

const CustomSlider = styled(Slider)`
    .ant-slider-track {
        background-color: #128c7e;
        transition: background-color 0.3s ease;
    }
    .ant-slider-track:hover {
        background-color: #40c4b7;
    }
`;

const MenuOptions = styled(IoIosArrowDown)`
    position: absolute;
    bottom: 20px;
    left: 20px;
    font-size: 18px;
    padding: 0;
    margin: 0;
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: transparent;
    cursor: pointer;
    visibility: hidden;

    & > svg {
        width: 18px;
        cursor: pointer;
        height: 18px;
    }
`;

const PlayerContainer = styled.div<PlayerContainerProps>`
    max-width: 350px;
    min-width: 342px;
    padding: ${(props) => (props.clientMessage ? '15px 4px 0 10px' : '15px 4px 15px 10px')};
    background: #ffffff;
    visibility: visible;

    &:hover ${MenuOptions} {
        visibility: visible;
    }
`;

const DefaultPlayerView: FC<PlayerViewProps> = (props) => {
    const { getTranslation } = useLanguageContext();
    const { setAudioControls } = useContext(AudioPlayerContext);
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const {
        audioControls,
        sharedAudioControls,
        handlePlay,
        onChangePlaybackRate,
        onChangeProgress,
        visiblePlayerGeneralByContext,
        isCurrentAudio,
        setVisiblePlayerGeneralByContext,
        audioUrl,
        onClose,
        data,
        handleReact,
        handleReply,
        canReaction,
    } = props;
    const [initialDuration, setInitialDuration] = useState<number>(0);
    const [audioTranscription, setAudioTranscription] = useState<AudioTranscription | null>(null);
    const [ellipsis, setEllipsis] = useState(true);
    const [transcribing, setTranscribing] = useState(false);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const workspaceAdmin = isWorkspaceAdmin(loggedUser, selectedWorkspace?._id);
    const isAgent = isUserAgent(loggedUser, selectedWorkspace?._id);
    const isAnyAdmin = isAnySystemAdmin(loggedUser);

    const canViewOptionByAgent =
        isAgent && !!data?.conversation?.members?.find((member) => member?.id === loggedUser?._id && !member?.disabled);

    const getAudioTranscription = async () => {
        setTranscribing(true);

        let error;
        const result = await LiveAgentService.activityAudioTranscription(
            selectedWorkspace._id,
            data.activityId,
            (err) => {
                error = err;
            }
        );

        if (error?.error || error?.statusCode === 400) {
            let message;
            switch (error.error) {
                case 'INVALID_FILE_TYPE_AUDIO_TRANSCRIPTION':
                    message = getTranslation('Invalid file type for transcription.');
                    break;
                case 'FILE_SIZE_EXCEED_AUDIO_TRANSCRIPTION':
                    message = getTranslation('File size too large for transcription.');
                    break;
                default:
                    message = getTranslation('An error occurred, please try again later.');
            }
            addNotification({
                message: message,
                type: 'warning',
                title: getTranslation('An error has occurred'),
            });
        }

        setTranscribing(false);
        if (result) {
            setEllipsis(false);
            setAudioTranscription(result);
        }
    };

    useEffect(() => {
        const { audioTranscriptions, activityId } = data;
        if (!!audioTranscriptions?.length && !!activityId) {
            const existAudio = audioTranscriptions.find(
                (currAudio: AudioTranscription) => currAudio.externalId === activityId
            );

            if (existAudio) {
                setAudioTranscription(existAudio);
            }
        }
    }, [data, data.audioTranscriptions]);

    const getDuration = () => {
        if (audioControls && audioControls.currentTime > 0) {
            return audioControls.currentTime;
        }

        return initialDuration;
    };

    const duration = getDuration();

    const handleTogglePlayPause = () => {
        if (audioControls?.playing && visiblePlayerGeneralByContext) {
            onClose();
            return setAudioControls((prevControls) => ({
                ...prevControls,
                playing: false,
            }));
        } else {
            handlePlay();
            setVisiblePlayerGeneralByContext(true);
        }
    };

    const { options } = useMessageOptions({
        audioUrl,
        data,
        handleReact,
        handleReply,
        isAudioPlayer: true,
        canReaction,
        audioTranscription,
        getAudioTranscription,
    });
    return (
        <PlayerContainer clientMessage={props.data?.clientMessage}>
            {audioUrl && (
                <audio
                    onLoadedMetadata={(event) => {
                        setInitialDuration(event.currentTarget.duration);
                    }}
                    src={audioUrl}
                    preload='auto'
                    style={{
                        display: 'none',
                    }}
                />
            )}

            <Row align={'middle'} style={{ paddingRight: 8 }} gutter={16}>
                <Col span={3}>
                    <FlexContainer>
                        <PlaybackRateButton onClick={onChangePlaybackRate}>
                            {sharedAudioControls?.speed + 'x'}
                        </PlaybackRateButton>
                    </FlexContainer>
                </Col>
                <Col span={3} style={{ padding: '0 8px' }}>
                    <CircleBackground onClick={handleTogglePlayPause}>
                        {audioControls?.playing && visiblePlayerGeneralByContext ? <PauseIcon /> : <PlayIcon />}
                    </CircleBackground>
                </Col>
                <Col span={15}>
                    <CustomSlider
                        tooltip={{
                            formatter: null,
                        }}
                        value={audioControls?.percentage}
                        onChange={(value) => {
                            if (isCurrentAudio && onChangeProgress) {
                                onChangeProgress(value);
                            }
                        }}
                    />
                </Col>
                <Col span={3}>
                    <Row>
                        {(isAnyAdmin || workspaceAdmin || canReaction || canViewOptionByAgent) && (
                            <Dropdown menu={{ items: options }} placement='bottom' trigger={['click']}>
                                <MenuOptions />
                            </Dropdown>
                        )}
                    </Row>

                    <Row>
                        <FlexContainer>
                            <span>{secondsToHms(duration)}</span>
                        </FlexContainer>
                    </Row>
                </Col>
            </Row>
            {!!audioTranscription ? (
                <div>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row title={getTranslation('Text transcribed by artificial intelligence')} gutter={8}>
                        <Col span={22}>
                            <Typography.Paragraph
                                style={{ maxWidth: '350px', minWidth: '312px', marginBottom: '0', paddingRight: '2px' }}
                                ellipsis={{ rows: ellipsis ? 2 : 200, expandable: false, symbol: ' ' }}
                            >
                                {audioTranscription.textTranscription}
                            </Typography.Paragraph>
                        </Col>
                        <Col span={2}>
                            <img
                                alt='ai-technology'
                                style={{ height: '16px', position: 'relative', right: '4px' }}
                                src='/assets/img/ai-technology.png'
                            />
                        </Col>
                    </Row>
                    <Row style={{ flexDirection: 'row-reverse', paddingRight: '8px' }}>
                        <Typography.Link
                            style={{ maxWidth: '34vh', color: '#1890ff' }}
                            onClick={() => setEllipsis(!ellipsis)}
                            strong
                        >
                            {ellipsis ? getTranslation('Show text') : getTranslation('Hide text')}
                        </Typography.Link>
                    </Row>
                </div>
            ) : null}
            {transcribing ? <LoadingDots text={getTranslation('Transcribing audio')} /> : null}
        </PlayerContainer>
    );
};

export default DefaultPlayerView;
