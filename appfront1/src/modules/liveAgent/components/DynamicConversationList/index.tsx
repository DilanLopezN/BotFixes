import styled from 'styled-components'
import { Wrapper } from '../../../../ui-kissbot-v2/common';

export const DynamicConversationList = styled(Wrapper)`
  @media screen and (min-width: 1601px) {
    width: 340px;
  }

  @media screen and (max-width: 1600px) {
    width: 330px;
  }
  
  @media screen and (max-width: 1420px) {
    width: 315px;
  }

  @media screen and (max-width: 1400px) {
    width: 295px;
  }
`;
