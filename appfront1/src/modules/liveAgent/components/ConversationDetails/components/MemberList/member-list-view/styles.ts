import { IoCloseCircleOutline } from 'react-icons/io5';
import styled from 'styled-components';

export const RemoveAgentIcon = styled(IoCloseCircleOutline)`
    position: absolute;
    font-size: 15px;
    background: #fff;
    border-radius: 50px;
    right: 26px;
    top: -4px;
    color: #696969;
    cursor: pointer;

    &:hover {
        color: #ff7875 !important;
    }
`;
