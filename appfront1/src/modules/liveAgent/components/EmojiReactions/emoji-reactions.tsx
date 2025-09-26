import { Popover, Space } from 'antd';
import { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import EmojiPicker, { EmojiData } from '../EmojiPicker';
import { EmojiReactionProps } from './interfaces';

export const EmojiReactions = ({ visible, onClose, onSelectEmoji, children, clientMessage }: EmojiReactionProps) => {
    const [emojiSelectorVisible, setEmojiSelectorVisible] = useState(false);

    return (
        <Popover
            placement={clientMessage ? 'right' : 'left'}
            content={
                <Space>
                    {['😀', '😂', '❤️', '👍', '🔥', '🎉'].map((emoji) => (
                        <span
                            style={{ cursor: 'pointer', fontSize: '20px' }}
                            key={emoji}
                            onClick={() => onSelectEmoji(emoji)}
                        >
                            {emoji}
                        </span>
                    ))}
                    <Popover
                        content={
                            <EmojiPicker
                                onSelected={(data: EmojiData) => {
                                    onSelectEmoji(data.native);
                                    setEmojiSelectorVisible(false);
                                }}
                            />
                        }
                        trigger='click'
                        open={emojiSelectorVisible}
                        onOpenChange={(visible) => setEmojiSelectorVisible(visible)}
                    >
                        <AiOutlinePlus
                            style={{ cursor: 'pointer' }}
                            size={18}
                            onClick={(e) => {
                                e.stopPropagation();
                                setEmojiSelectorVisible(true);
                            }}
                        />
                    </Popover>
                </Space>
            }
            trigger='click'
            open={visible}
            onOpenChange={(visible) => !visible && onClose()}
            showArrow={false}
        >
            {children}
        </Popover>
    );
};
