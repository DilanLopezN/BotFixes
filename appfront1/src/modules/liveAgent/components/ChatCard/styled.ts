import { getColor, ColorType, ColorVariation } from './../../../../ui-kissbot-v2/theme/colors';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { MdEmojiEmotions } from 'react-icons/md';

const Balloon = styled(Wrapper)<any>`
    max-width: 400px;
    position: relative;
    border-radius: 0.4em;
    padding: 8px 9px 23px 9px;
    margin-bottom: 10px;
    ${(props) =>
        !props.ownerMessage
            ? !!props.clientMessage
                ? `background: #FFF;`
                : !!props.botMessage
                ? 'background: #FFF;'
                : 'background: #FFF;'
            : `background: ${getColor(ColorType.success, ColorVariation.pastel)};`}

    ${(props) => (!!props.clientMessage ? `margin-left: 15px;` : `margin-right: 15px;`)}

  -webkit-box-shadow: 5px 6px 7px -5px rgba(0,0,0,0.4);
    -moz-box-shadow: 5px 6px 7px -5px rgba(0, 0, 0, 0.4);
    box-shadow: 5px 6px 7px -5px rgba(0, 0, 0, 0.4);
    transition: 0.3s;

    &:after {
        content: '';
        position: absolute;
        top: 20px;
        width: 0;
        height: 0;
        border: 7px solid transparent;
        margin-top: -7px;

        ${(props) =>
            !!props.ownerMessage
                ? `
        border-left-color: ${getColor(ColorType.success, ColorVariation.pastel)};
        border-right: 0;
        right: 0;
        margin-right: -7px;
      `
                : !!props.clientMessage
                ? `
              border-right-color: #FFF;
              border-left: 0;
              left: 0;
              margin-left: -7px;
            `
                : !!props.botMessage
                ? `
              border-left-color: #FFF;
              border-right: 0;
              right: 0;
              margin-right: -7px;
          `
                : `
          border-left-color: #FFF;
          border-right: 0;
          right: 0;
          margin-right: -7px;
      `}
    }
`;

const NumberButton = styled(Wrapper)<any>`
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    cursor: pointer;
    border-radius: 5px;
    border: 1px solid ${(props) => props.colorSettings || '#696969'};
    color: ${(props) => props.colorSettings || '#696969'};
    width: 25px;
    min-height: 32px;
    margin-right: 5px;
    background: #fff;
`;

export const EmojiTriggerStyle = styled(MdEmojiEmotions)<any>`
    position: relative;
    font-size: 20px;
    visibility: hidden;
    cursor: pointer;
    right: 4px;
`;

export const OptionsResponse = styled.div<any>`
    visibility: hidden;
    z-index: 0;
    right: ${(props) => (props.clientMessage ? '6px' : '26px')};
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: transparent;
    cursor: pointer;

    & > svg {
        width: 22px;
        cursor: pointer;
        height: 22px;
    }
`;
export const ContainerWrapped = styled(Wrapper)<any>`
    align-items: center;
    &:hover ${OptionsResponse} {
        visibility: visible;
        z-index: 99;
        background-color: ${(props) => (props.clientMessage ? '#fff' : '#dcf8c6')};
        cursor: pointer !important;
    }

    &:hover ${EmojiTriggerStyle} {
        visibility: visible;
    }
`;

export { Balloon, NumberButton };
