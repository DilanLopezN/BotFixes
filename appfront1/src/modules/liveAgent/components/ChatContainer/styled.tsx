import styled from 'styled-components'
import { Wrapper } from '../../../../ui-kissbot-v2/common'

const Body = styled(Wrapper)`
  background-color: #F0F0F0;
  overflow-y: scroll;

  &.disabled {
    pointer-events: none;
    opacity: 0.7;
  }
`;

const Background = styled(Wrapper)`
    z-index: 0;
    background-image: url('/assets/img/bg-chat-compressed.jpg');
    background-repeat: repeat;
    opacity: 0.25;
`;

export {
  Body,
  Background
}
