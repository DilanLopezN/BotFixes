import { IoCloseCircleOutline } from 'react-icons/io5';
import styled from 'styled-components';

export const StatusIcon = styled.div<{ status: string }>`
    position: absolute;
    bottom: -3px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px #fff solid;
    left: 0;
    background: ${(props) => (props.status === 'disconnected' ? '#777' : '#24af24')};
`;

export const RemoveAgentIcon = styled(IoCloseCircleOutline)`
    position: absolute;
    font-size: 15px;
    background: #fff;
    border-radius: 50px;
    right: -3px;
    top: -8px;
    color: #696969;
    cursor: pointer;
`;

export const DynamicAvatar = styled.div<{ index: number }>`
    margin: ${(props) => (props.index === 0 ? `0` : `0 0 0 -7px`)};
    border-radius: 50%;
    border: 2px #f8f8f8 solid;
    background: #f8f8f8;
    position: relative;
`;

export const Exceeded = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 15px;
    background-color: #919191;
    width: 32px;
    height: 32px;
    color: #fff !important;
`;
