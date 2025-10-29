import { ContentBlock } from 'draft-js';

export const blockStyleFn = (block: ContentBlock): string => {
    const blockAlignment = block.getData().get('text-align');
    if (blockAlignment) {
        return `${blockAlignment}`;
    }
    return '';
};
