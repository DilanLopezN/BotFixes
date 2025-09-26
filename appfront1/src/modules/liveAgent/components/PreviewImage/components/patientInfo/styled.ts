import styled from 'styled-components';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';

const Content = styled.div`
    margin: 20px 0 0 0;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const SwitchIcon = styled(HiOutlineSwitchHorizontal)`
    display: flex;
    justify-content: flex-end;
    font-size: 18px;
    min-width: 18px;
    color: #666;
    cursor: pointer;
`;

const PatientDetails = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #FFF;
    padding: 8px;
    border-radius: 4px;
    flex: 1;
    box-shadow: 1px 1px 3px 0px rgb(0 0 0 / 40%);
    background: #fdfdfd;
   
    & > div {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    p {
        margin: 0;    
        font-size: 14px;
        color: #666;
    }

    p:nth-child(1) {
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    p:nth-child(2) {
        font-size: 13px;
    }

    p:nth-child(3) {
        font-size: 13px;
    }
`;

const Loading = styled.img`
    height: 40px;
`;

export { Content, Actions, PatientDetails, SwitchIcon, Loading }