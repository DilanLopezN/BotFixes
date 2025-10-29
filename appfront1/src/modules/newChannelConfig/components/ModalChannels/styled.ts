import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Container = styled('div')`
    @-webkit-keyframes openSide {
        from { width: 0; }
        to { width:800px; }
    }

    @keyframes openSide {
        from { width: 0; }
        to { width: 800px; }
    }

    @-webkit-keyframes closeSide {
        to { width: 0; }
        from { width: 800px; }
    }

    @keyframes closeSide {
        to {width: 0; }
        from {width: 800px; }
    }

    &:not(.closing){
        -webkit-animation-name: openSide;
        -webkit-animation-duration: .3s; 
        animation-name: openSide;
        animation-duration: .3s;
    }

    &.closing{
        -webkit-animation-name: closeSide;
        -webkit-animation-duration: .3s; 
        animation-name: closeSide;
        animation-duration: .3s;
    }
    position: absolute;
    background: #f7f7f7;
    width: 800px;
    height: 100%;
    z-index: 1;
    overflow: hidden;
    right: 0;
    border-right: 1px #F0F0F0 solid;
    box-shadow: rgba(119, 119, 119, 0.09) -4px 11px 8px;
`;

const ViewArea = styled(Wrapper)``;

export {
    ViewArea,
    Container
}