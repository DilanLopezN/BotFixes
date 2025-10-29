import { IoIosArrowDown } from 'react-icons/io';
import { MdEmojiEmotions } from 'react-icons/md';
import styled from 'styled-components';
import { ActivityType } from 'kissbot-core';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from './../../../../ui-kissbot-v2/theme/colors';

const Wrapped = styled(Wrapper)`
    p {
        color: ${getColor(ColorType.text, ColorVariation.dark)};
    }
`;

const Balloon = styled(Wrapper)<any>`
    display: flex;
    justify-content: space-between;
    position: relative;
    flex-direction: column;
    border-radius: 0.4em;
    font-size: 13px;
    padding: 5px 5px 22px 5px;
    color: ${getColor(ColorType.text, ColorVariation.dark)};

    ${(props) => (props.clientMessage ? `margin-bottom:0;` : `margin-bottom:10px;`)}

    ${(props) => {
        if (props.activityType === ActivityType.comment) {
            return `background: #fef1b6;`;
        }

        return !props.ownerMessage
            ? !!props.clientMessage
                ? `background: #FFF;`
                : !!props.botMessage
                ? 'background: #FFF;'
                : 'background: #FFF;'
            : `background: ${getColor(ColorType.success, ColorVariation.pastel)};`;
    }}

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

        ${(props) => {
            if (props.activityType === ActivityType.comment) {
                return `
                    border-left-color: #fef1b6;
                    border-right: 0;
                    right: 0;
                    margin-right: -7px;
                `;
            }

            return !!props.ownerMessage
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
                `;
        }}
    }
`;

const Audio = styled.audio`
    background-color: #f2f3f4;
    border-radius: 3px;
`;

export { Audio, Balloon, Wrapped };
