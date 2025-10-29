import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

const Scroll = styled(Wrapper)`
    scrollbar-width: thin;
    scrollbar-color: rgba(17, 17, 17, 0.2) transparent;
    
    &::-webkit-scrollbar {
        height: 5px;
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background :rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;

export {
    Scroll,
}
