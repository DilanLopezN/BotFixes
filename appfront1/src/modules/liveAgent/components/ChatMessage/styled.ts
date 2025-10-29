import { MdEmojiEmotions } from 'react-icons/md';
import ReactPlayer from 'react-player';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from './../../../../ui-kissbot-v2/theme/colors';

const ReactPlayerDiv = styled(ReactPlayer)`
    min-height: 150px;
    min-width: 312px;
    max-height: 200px;
    max-width: 350px;
`;

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
    border-radius: 0.4em;
    font-size: 13px;
    max-width: 50vw;
    ${(props) => (!props.isFileActivity ? `padding: 5px 7px 8px 9px;` : `padding: 4px 4px 22px 4px;`)}
    color: ${getColor(ColorType.text, ColorVariation.dark)};

    ${(props) =>
        !props.ownerMessage
            ? `background: #FFF;`
            : `background: ${getColor(ColorType.success, ColorVariation.pastel)};`}

    ${(props) => (!!props.clientMessage ? `margin-left: 15px;` : `margin-right: 15px;`)}

  -webkit-box-shadow: 4px 5px 5px -6px rgba(0,0,0,0.4);
    -moz-box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);

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
                : `
              border-left-color: #FFF;
              border-right: 0;
              right: 0;
              margin-right: -7px;
            `}
    }
`;

export const EmojiTriggerStyle = styled(MdEmojiEmotions)<any>`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    visibility: hidden;
    cursor: pointer;
    right: ${(props) => (props.clientMessage ? '-24px' : '')};
    left: ${(props) => (props.clientMessage ? '' : '-24px')};
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

export { Balloon, ReactPlayerDiv, Wrapped };
