import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

export type AudioPlayerContextType = {
    audioRef: any;
    audio: AudioState | undefined;
    setAudio: React.Dispatch<React.SetStateAction<AudioState | undefined>>;
    sharedAudioControls: SharedAudioControls | undefined;
    setSharedAudioControls: React.Dispatch<React.SetStateAction<SharedAudioControls>>;
    audioControls: AudioControls | undefined;
    setVisiblePlayerGeneralByContext: React.Dispatch<React.SetStateAction<boolean>>;
    setAudioControls: React.Dispatch<React.SetStateAction<AudioControls>>;
    getCachedPlayer: (contextId: string, audioId: string) => AudioControls;
    userNameByAudio: string;
    visiblePlayerGeneralByContext: boolean;
    setUserNameByAudio: React.Dispatch<React.SetStateAction<string>>;
};

export const AudioPlayerContext = createContext<AudioPlayerContextType>({
    audioRef: null,
    audio: undefined,
    visiblePlayerGeneralByContext: false,
    setVisiblePlayerGeneralByContext: () => {},
    setAudio: () => {},
    audioControls: undefined,
    sharedAudioControls: undefined,
    setSharedAudioControls: () => {},
    setAudioControls: () => {},
    getCachedPlayer: () => defaultControls,
    setUserNameByAudio: () => {},
    userNameByAudio: '',
});

export interface AudioState {
    audioUrl: string;
    audioId: string;
    contextId: string | null;
    data?: any;
}

export type AudioControls = {
    playing: boolean;
    currentTime: number;
    percentage: number;
    duration: number;
};

export type SharedAudioControls = {
    speed: number;
    volume: number;
};

const defaultControls: AudioControls = {
    playing: false,
    currentTime: 0,
    percentage: 0,
    duration: 0,
};

const defaultSharedControls: SharedAudioControls = {
    speed: 1.0,
    volume: 1,
};

export const useAudioPlayerContext = () => useContext(AudioPlayerContext);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<any>(null);
    const rafRef = useRef<number | undefined>();

    const [audio, setAudio] = useState<AudioState | undefined>({
        audioUrl: '',
        audioId: '',
        contextId: null,
    });
    const [visiblePlayerGeneralByContext, setVisiblePlayerGeneralByContext] = useState<boolean>(false);
    const [sharedAudioControls, setSharedAudioControls] = useState<SharedAudioControls>(defaultSharedControls);
    const [audioControls, setAudioControls] = useState<AudioControls>(defaultControls);
    const [userNameByAudio, setUserNameByAudio] = useState<string>('');

    useEffect(() => {
        if (audio?.audioUrl) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.onended = null;
            }

            setAudioControls({
                ...defaultControls,
                playing: true,
            });
            audioRef.current = new Audio(audio?.audioUrl);
            audioRef.current.playbackRate = sharedAudioControls.speed;
            audioRef.current.loop = false;

            audioRef.current.onended = () => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                }
                setAudioControls((prevState) => ({
                    ...prevState,
                    percentage: 0,
                    currentTime: 0,
                    playing: false,
                }));
            };

            if (audio?.audioId && audio.contextId) {
                const existsCacheAudio = getCachedPlayer(audio.contextId, audio.audioId);

                if (existsCacheAudio && existsCacheAudio.currentTime > 0) {
                    audioRef.current.currentTime = existsCacheAudio.currentTime;
                }
            }

            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play().catch((error) => {
                        console.error('Erro ao reproduzir áudio:', error);
                        setAudioControls((prevState) => ({
                            ...prevState,
                            playing: false,
                        }));
                    });
                }
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audio]);

    useEffect(() => {
        return () => {
            setAudio(undefined);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    useEffect(() => {
        const updateCachedControls = () => {
            if (audio?.contextId) {
                audioCtxRef.current = {
                    ...(audioCtxRef.current ?? {}),
                    [audio.contextId]: {
                        ...(audioCtxRef.current?.[audio.contextId] ?? {}),
                        [audio.audioId]: {
                            ...audioControls,
                            playing: false,
                        },
                    },
                };
            }
        };

        updateCachedControls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioControls]);

    useEffect(() => {
        if (!audioRef.current || !audio?.audioUrl) return;

        if (audioControls.playing) {
            // Add a small delay to ensure audio element is ready
            const playAudio = async () => {
                try {
                    if (audioRef.current) {
                        await audioRef.current.play();
                    }
                } catch (error) {
                    console.error('Erro ao reproduzir áudio:', error);
                    setAudioControls((prevState) => ({
                        ...prevState,
                        playing: false,
                    }));
                }
            };
            playAudio();
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }
    }, [audioControls.playing, audio?.audioUrl]);

    const handleCurrentTimeChanged = () => {
        if (!audioRef.current) {
            return;
        }

        const { currentTime = 0, duration = 0 } = audioRef.current;
        const percentage = (currentTime / duration) * 100;

        if (percentage >= 100) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioControls((prevState) => ({
                ...prevState,
                percentage: 0,
                currentTime: 0,
                playing: false,
            }));
        } else {
            setAudioControls((prevState) => ({
                ...prevState,
                percentage,
                currentTime,
                duration,
            }));
        }
    };

    useEffect(() => {
        const updateAudioInfo = () => {
            if (audioControls?.playing && audio?.audioId) {
                handleCurrentTimeChanged();
                rafRef.current = requestAnimationFrame(updateAudioInfo);
            }
        };

        rafRef.current = requestAnimationFrame(updateAudioInfo);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [audioControls?.playing, audio?.audioId]);

    const getCachedPlayer = (contextId: string, audioId: string): AudioControls => {
        const dataByCtx = audioCtxRef.current?.[contextId];
        if (!dataByCtx) {
            return defaultControls;
        }

        return dataByCtx?.[audioId] || defaultControls;
    };

    return (
        <AudioPlayerContext.Provider
            value={{
                setUserNameByAudio,
                userNameByAudio,
                setAudioControls,
                audioControls,
                sharedAudioControls,
                setSharedAudioControls,
                visiblePlayerGeneralByContext,
                setVisiblePlayerGeneralByContext,
                audio,
                setAudio,
                getCachedPlayer,
                audioRef,
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    );
};
