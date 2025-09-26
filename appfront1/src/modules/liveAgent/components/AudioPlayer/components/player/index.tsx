import { FC, useContext } from 'react';
import { AudioControls, AudioPlayerContext } from '../../context/audio-player.context';
import DefaultPlayerView from './default-player.view';
import GeneralPlayerView from './general-player-view';
import { AudioPlayerProps, PlayerViewProps } from './props';

const AudioPlayer: FC<AudioPlayerProps> = (props) => {
    const { url, id, contextId, type, onOpenClick, data, handleReact, handleReply, canReaction } = props;

    const {
        setAudioControls,
        userNameByAudio,
        audio,
        audioControls,
        audioRef,
        sharedAudioControls,
        visiblePlayerGeneralByContext,
        setVisiblePlayerGeneralByContext,
        setAudio,
        getCachedPlayer,
        setSharedAudioControls,
        setUserNameByAudio,
    } = useContext(AudioPlayerContext);

    const isCurrentAudio = audio?.audioId && audio?.audioId === id;

    const handlePlay = () => {
        if (type === 'general') {
            return setAudioControls((prevControls) => ({
                ...prevControls,
                playing: !prevControls?.playing,
            }));
        }

        if (type === 'default' && id && url) {
            if (isCurrentAudio) {
                return setAudioControls((prevControls) => ({
                    ...prevControls,
                    playing: true,
                }));
            } else {
                if (audioControls?.playing) {
                    audioRef.current?.pause();
                    setAudioControls((prevControls) => ({
                        ...prevControls,
                        playing: false,
                    }));
                }
            }

            setAudio((prevState) => ({
                ...prevState,
                audioUrl: url,
                audioId: id,
                contextId,
                data,
            }));
        }
        setUserNameByAudio(data?.name);
    };

    const onChangeProgress = (newPercentValue: number) => {
        if (!audioControls) return;

        const { duration, playing } = audioControls;
        const newCurrentTime = (duration / 100) * newPercentValue;

        if (!playing) {
            setAudioControls((prevState) => ({
                ...prevState,
                currentTime: newCurrentTime,
                percentage: newPercentValue,
            }));
        }

        if (audioRef.current) {
            audioRef.current.currentTime = newCurrentTime;
        }
    };

    const playbackRates = [1.0, 1.5, 2.0];

    const handleChangePlaybackRate = () => {
        let { speed = 1.0 } = sharedAudioControls ?? {
            speed: 1.0,
        };

        const currentIndexSpeed = playbackRates.findIndex((rate) => speed === rate);
        const nextSpeed = playbackRates[currentIndexSpeed + 1];

        if (nextSpeed) {
            speed = nextSpeed;
        } else {
            speed = 1.0;
        }

        setSharedAudioControls((prevControls) => ({
            ...prevControls,
            speed: speed,
        }));

        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    };

    const getAppComponent = ({ audioControls }: { audioControls?: AudioControls }) => {
        const props: PlayerViewProps = {
            handlePlay,
            audioControls,
            setVisiblePlayerGeneralByContext,
            onChangePlaybackRate: handleChangePlaybackRate,
            onChangeProgress,
            audio,
            visiblePlayerGeneralByContext,
            userNameByAudio,
            sharedAudioControls,
            onClose: () => {
                setVisiblePlayerGeneralByContext(false);
                if (audioControls?.playing) {
                    audioRef.current?.pause();
                }
                return setAudioControls((prevControls) => ({
                    ...prevControls,
                    playing: false,
                }));
            },
            audioUrl: url,
            isCurrentAudio,
            data,
            handleReact: handleReact || (() => {}),
            handleReply: handleReply || (() => Promise.resolve()),
            canReaction: canReaction || false,
        };

        if (onOpenClick) {
            props.onOpenClick = () => {
                return onOpenClick(audio?.data);
            };
        }

        if (type === 'general') {
            return <GeneralPlayerView {...props} />;
        }

        return <DefaultPlayerView {...props} />;
    };

    const visibleGeneralPlayer =
        !!contextId && audio?.contextId && contextId !== audio?.contextId && visiblePlayerGeneralByContext;

    if (type === 'general' && !visibleGeneralPlayer) {
        return null;
    }

    if (type === 'general' && visibleGeneralPlayer) {
        return getAppComponent({ audioControls });
    }

    if (isCurrentAudio) {
        if (audioControls && audioControls.percentage >= 99) {
            setVisiblePlayerGeneralByContext(false);
        }
        return getAppComponent({ audioControls });
    }

    const getCachedControls = () => {
        if (type === 'default' && id) {
            return getCachedPlayer(contextId, id) ?? {};
        }

        return {
            percentage: 0,
            currentTime: 0,
            duration: 0,
        } as AudioControls;
    };

    const cachedControls = getCachedControls();

    return getAppComponent({ audioControls: cachedControls });
};

export default AudioPlayer;
