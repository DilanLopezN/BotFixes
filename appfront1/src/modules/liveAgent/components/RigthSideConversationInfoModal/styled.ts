import { IoMdArrowBack } from 'react-icons/io';
import styled from 'styled-components';

const Container = styled('div')`
.body {
    /* Safari 4.0 - 8.0 */
    @-webkit-keyframes openSideModal {
        from {transform: translateX(300px)}
        to {transform: translateX(0px)}
    }

    /* Standard syntax */
    @keyframes openSideModal {
        from {transform: translateX(300px)}
        to {transform: translateX(0px)}
    }

   /* Safari 4.0 - 8.0 */
    @-webkit-keyframes closeSideModal {
        to {transform: translateX(300px)}
        from {transform: translateX(0px)}
    }

    /* Standard syntax */
    @keyframes closeSideModal {
        to {transform: translateX(300px)}
        from {transform: translateX(0px)}
    }
    &:not(.closing){
        -webkit-animation-name: openSideModal; /* Safari 4.0 - 8.0 */
        -webkit-animation-duration: .3s; /* Safari 4.0 - 8.0 */
        animation-name: openSideModal;
        animation-duration: .3s;
    }
    &.closing{
        -webkit-animation-name: closeSideModal; /* Safari 4.0 - 8.0 */
        -webkit-animation-duration: .4s; /* Safari 4.0 - 8.0 */
        animation-name: closeSideModal;
        animation-duration: .4s;
    }
}
    max-width: 300px;
    min-width: 300px;
    height: 100%;
    position: absolute;
    z-index: 1;
    top: 0px;
    right: 0;
    background-color: #ffffff;

    @media (max-width: 1400px) {
        max-width: 275px;
        min-width: 275px;
    }

    @media (max-width: 1020px) {
        right: -1000px
    }
    
`;

const Header = styled.div`
    display: flex; 
    justify-content: space-between;
    padding: 5px;
    border-bottom: 1px #eaeaea solid;
    height: 65px;
    align-items: center;
`;

const Title = styled.div`
    color: #696969;
    padding: 4px 0;
    margin-right: 100px;
    font-size: 17px;
`;

const Body = styled.div`
    min-height: 65px;
    height: 100%;
`;

const List = styled.div`
    display: inline-flex;
    flex-wrap: wrap;
    height: 100%;
    align-content: flex-start;
    overflow: auto;
    margin: 0px 0px 5px 8px;
    padding: 15px 10px;
    
    scrollbar-width: thin;
    scrollbar-color: rgba(17, 17, 17, 0.2) transparent;

    &::-webkit-scrollbar {
        height: 5px;
        width: 5px;
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

const BackModal = styled(IoMdArrowBack)`
    font-size: 22px;
    position: relative;
    cursor: pointer;
    color: #696969;
`;

export {
    Container,
    BackModal,
    Header,
    Title,
    Body,
    List,
}
