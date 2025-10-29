import { useMemo } from 'react';
import { ContentBlock, ContentState } from 'draft-js';

const useRegexStrategy = (regex: RegExp) => {
    const findWithRegex = (
        regex: RegExp,
        contentBlock: ContentBlock,
        callback: (start: number, end: number) => void
    ) => {
        const text = contentBlock.getText();
        let matchArr;
        while ((matchArr = regex.exec(text)) !== null) {
            const start = matchArr.index;
            callback(start, start + matchArr[0].length);
        }
    };

    const handleStrategy = useMemo(() => {
        return (
            contentBlock: ContentBlock,
            callback: (start: number, end: number) => void,
            contentState: ContentState
        ) => {
            findWithRegex(regex, contentBlock, callback);
        };
    }, [regex]);

    return handleStrategy;
};

export { useRegexStrategy };
