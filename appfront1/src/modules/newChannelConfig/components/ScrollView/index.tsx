import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const ScrollView = styled(Wrapper)`
    height: calc(100vh - 70px);
    overflow-y: auto;

&::-webkit-scrollbar {
    height: 4px;
    width: 10px;
}

&::-webkit-scrollbar-track {
    border-radius: 0px;
    background: transparent;
}

&::-webkit-scrollbar-thumb {
    background :rgba(17, 17, 17, 0.3);
    border-radius: 0px;
    box-shadow: none;
}`;

export { ScrollView };
