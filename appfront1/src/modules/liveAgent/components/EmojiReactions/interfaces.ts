import { ReactNode } from 'react';

export interface EmojiReactionProps {
    visible: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
    children: ReactNode;
    clientMessage: boolean | undefined;
}
