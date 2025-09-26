import styled from 'styled-components';

const ScrollableListContainer = styled('div')`
    width: 100%;
    height: 100%;
    overflow-y: auto;
`;

const PaginationContainer = styled('div')`
    width: 100%;

    margin: 20px auto;
    display: flex;
    justify-content: flex-end;
`;

const Container = styled('div')`
    @-webkit-keyframes openSide {
        from {
            width: 0;
        }
        to {
            width: 800px;
        }
    }

    @keyframes openSide {
        from {
            width: 0;
        }
        to {
            width: 800px;
        }
    }

    @-webkit-keyframes closeSide {
        to {
            width: 0;
        }
        from {
            width: 800px;
        }
    }

    @keyframes closeSide {
        to {
            width: 0;
        }
        from {
            width: 800px;
        }
    }

    &:not(.closing) {
        -webkit-animation-name: openSide;
        -webkit-animation-duration: 0.3s;
        animation-name: openSide;
        animation-duration: 0.3s;
    }

    &.closing {
        -webkit-animation-name: closeSide;
        -webkit-animation-duration: 0.3s;
        animation-name: closeSide;
        animation-duration: 0.3s;
    }
    position: absolute;
    background: #fff;
    width: 800px;
    height: 100%;
    z-index: 999;
    overflow: hidden;
    right: 0;
    border-right: 1px #f0f0f0 solid;
    box-shadow: rgba(119, 119, 119, 0.09) -4px 11px 8px;
`;

export { Container, PaginationContainer, ScrollableListContainer };
