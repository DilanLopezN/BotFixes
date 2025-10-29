import { ConversationCardData } from '../../../ConversationCard/props';
import { AudioControls, AudioState, SharedAudioControls } from '../../context/audio-player.context';

export interface AudioPlayerProps {
    url?: string;
    id?: string;
    contextId: string;
    data?: any;
    type: 'general' | 'default';
    onOpenClick?: (data?: any) => void;
    conversation?: ConversationCardData | undefined;
    handleReact?: () => void;
    handleReply?: () => Promise<void>;
    canReaction?: boolean;
}

export interface PlayerViewProps {
    audio?: AudioState;
    audioControls?: AudioControls;
    audioUrl?: string;
    sharedAudioControls?: SharedAudioControls;
    visiblePlayerGeneralByContext: boolean;
    onOpenClick?: () => void;
    handlePlay: () => void;
    onChangePlaybackRate: () => void;
    onChangeProgress?: (value: number) => void;
    onClose: () => void;
    setVisiblePlayerGeneralByContext: (value: boolean) => void;
    userNameByAudio?: string;
    isCurrentAudio?: string | boolean;
    data?: any;
    handleReact: () => void;
    handleReply: () => Promise<void>;
    canReaction: boolean;
}

export interface PlayerContainerProps {
    clientMessage?: boolean;
}
