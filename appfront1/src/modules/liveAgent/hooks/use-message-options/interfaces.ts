import { AudioTranscription } from '../../../../ui-kissbot-v2/interfaces/audio-transcription';

export interface UseAudioOptionsProps {
    audioUrl?: string | undefined;
    data?: any;
    isAudioPlayer?: boolean;
    canReaction?: boolean;
    audioTranscription?: AudioTranscription | null;
    activityText?: string;
    handleReact?: () => void;
    handleReply?: () => void;
    getAudioTranscription?: () => Promise<void>;
}
