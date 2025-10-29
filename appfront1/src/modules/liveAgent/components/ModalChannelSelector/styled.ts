import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background : #E8E8E8;
        border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
        background : #999999;
        border-radius: 10px;
    }
`;

const EmptyDataInfo = styled.div`
    text-align: center;
    margin: 20px 0;
`;

export {
    Scroll,
    EmptyDataInfo
}
