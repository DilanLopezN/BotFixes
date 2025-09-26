import { ColorType, getColor, ColorVariation } from './../../../../ui-kissbot-v2/theme/colors';
import styled from 'styled-components'
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Balloon = styled(Wrapper)`
  min-width: 180px;
  position: relative;
  font-size: 13px;
  border-radius: .4em;
  padding: 2px 8px;
  background: ${getColor(ColorType.primary, ColorVariation.pastel)};
  -webkit-box-shadow: 5px 5px 5px -5px rgba(0,0,0,0.4);
  -moz-box-shadow: 5px 5px 5px -5px rgba(0,0,0,0.4);
  box-shadow: 5px 5px 5px -5px rgba(0,0,0,0.4);
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #777;
`;

export {
    Timestamp,
    Balloon
}