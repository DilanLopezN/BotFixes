export const isOnlyOneEmoji = (text: string): boolean => {
    const emojiPattern =
        /^[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}]+(?:\u200D[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}])*(?:\u{FE0F}|\u{FE0E})?$/gu;
    return emojiPattern.test(text);
};

export const isOnlyEmojis = (text: string): boolean => {
    const trimmed = text.trim();
    const emojiPattern =
        /^[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}\s]+(?:\u200D[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}])*(?:\u{FE0F}|\u{FE0E})?$/gu;
    return emojiPattern.test(trimmed);
};
