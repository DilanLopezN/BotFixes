import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import pt from '@emoji-mart/data/i18n/pt.json';

export interface EmojiData {
    id: string;
    name: string;
    native: string;
    unified: string;
    keywords: string[];
    shortcodes: string;
    aliases: string[];
}

export interface EmojiPickerProps {
    onSelected: (emoji: EmojiData) => void;
}
const EmojiPicker = ({ onSelected }) => {
    return (
        <Picker
            data={data}
            autoFocus
            onEmojiSelect={onSelected}
            showPreview={false}
            showSkinTones={false}
            skin={3}
            native={true}
            i18n={pt}
            theme='light'
            enableFrequentEmojiSort={false}
        />
    );
};

export default EmojiPicker;
