import { getColor, ColorType, ColorVariation } from './../../../../ui-kissbot-v2/theme/colors';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Wrapped = styled(Wrapper)`
  p { 
    color: ${getColor(ColorType.text, ColorVariation.dark)};
  }
`;

const Balloon = styled(Wrapper)<any>`
  min-width: 90px;
  display: flex;
  justify-content: space-between;
  position: relative;
  flex-direction: column;
  border-radius: .4em;
  font-size: 13px;
  padding: 5px 7px 8px 9px;
  max-width: 50vw;
  color: ${getColor(ColorType.text, ColorVariation.dark)};
  background: #ff3c3c;
  opacity: 0.8;
  -webkit-box-shadow: 4px 5px 5px -6px rgba(0,0,0,0.4);
  -moz-box-shadow: 4px 5px 5px -6px rgba(0,0,0,0.4);
  box-shadow: 4px 5px 5px -6px rgba(0,0,0,0.4);

  &:after {
    content: '';
    position: absolute;
    top: 20px;
    width: 0;
    height: 0;
    border: 7px solid transparent;
    margin-top: -7px;
    border-right-color: #FFF;
    border-left-color: #ff3c3c;
    border-right: 0;
    right: 0;
    margin-right: -7px;
  }`;

export {
    Wrapped,
    Balloon
}