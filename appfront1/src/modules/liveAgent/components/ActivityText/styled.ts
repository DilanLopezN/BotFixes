import { MdEmojiEmotions } from 'react-icons/md';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from './../../../../ui-kissbot-v2/theme/colors';

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
    padding: 5px 7px 8px 9px;
    max-width: calc(48vw + 48px);
    color: ${getColor(ColorType.text, ColorVariation.dark)};

    ${(props) => (props.clientMessage ? `margin-bottom:0;` : `margin-bottom:10px;`)}
    @media (max-width: 1368px) {
        max-width: calc(43.5vw + 48px);
    }

    ${(props) =>
        !props.ownerMessage
            ? !!props.clientMessage
                ? `background: #FFF;`
                : !!props.botMessage
                ? 'background: #FFF;'
                : 'background: #FFF;'
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

const MaxWidth = styled(Wrapper)`
    word-wrap: break-word;
    display: inline-block;
    max-width: 42vw;
    margin: 0 6px 0 0;

    @media (max-width: 1368px) {
        max-width: 38vw;
    }
`;

export { Balloon, MaxWidth, Wrapped };
