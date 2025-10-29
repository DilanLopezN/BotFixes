import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

const FormContainer = styled.div`
    width: 100%;
    height: 100vh;
    overflow-y: auto;
`;

const RowDiv = styled.div`
    width: 100%;
    display: flex;
`;

const Col33 = styled.div`
    width: 33%;
`;

const Col50 = styled.div`
    width: 50%;
`;

const BtnContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
`;

const CustomFields = styled.div`
    display: flex;
    justify-content: start;
`;

const Content = styled.div`
    padding: 20px 20px;
`;

const Scroll = styled(Wrapper)`
    /* Hide scrollbar for webkit browsers */
    &::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
    }

    &::-webkit-scrollbar-track {
        display: none;
    }

    &::-webkit-scrollbar-thumb {
        display: none;
    }

    /* Hide scrollbar for Firefox */
    scrollbar-width: none;
    -ms-overflow-style: none;

    /* Ensure scroll functionality remains */
    overflow-y: auto;
    overflow-x: hidden;
`;

export { BtnContainer, Col33, Col50, Content, CustomFields, FormContainer, RowDiv, Scroll };
