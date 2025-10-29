import { Button as AntButton, List } from 'antd';

import { MdDeleteOutline } from 'react-icons/md';
import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export const AnimatedButton = styled(AntButton)`
    &.fade-enter {
        animation: ${fadeIn} 1s forwards !important;
        -webkit-animation: ${fadeIn} 1s forwards !important;
    }
    &.fade-exit {
        animation: ${fadeOut} 1s forwards !important;
        -webkit-animation: ${fadeOut} 1s forwards !important;
    }
`;
export const DeleteIcon = styled(MdDeleteOutline)`
    font-size: 18px;
    margin: 14px 0 0 0;
    cursor: pointer;

    &:hover {
        color: #007bff;
    }
`;
