import styled from 'styled-components';
import { Wrapper } from '../../../../../../../../../ui-kissbot-v2/common';

export const Wrapped = styled(Wrapper)`
    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;
