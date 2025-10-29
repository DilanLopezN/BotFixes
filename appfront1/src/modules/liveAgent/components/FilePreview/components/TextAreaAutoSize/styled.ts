import styled from 'styled-components';
import { getColor, ColorType, ColorVariation } from '../../../../../../ui-kissbot-v2/theme';

const TextareaMessage = styled.textarea`
    width: 50%;
    box-sizing: border-box;
    padding: 10px 70px 10px 12px;
    border: 1px solid #d9d9d9;
    min-height: 30px !important;
    border-radius: 10px;
    background: #fff;
    outline: none;
    overflow-y: scroll;
    max-height: 120px;
    color: ${getColor(ColorType.text, ColorVariation.dark)};
    resize: none;
    overflow-x: hidden;

    &:disabled {
        cursor: initial;
        opacity: 1;
    }

    &::-webkit-scrollbar {
        width: 0;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 0px;
    }

    &::-webkit-scrollbar-thumb {
        border-radius: 0px;
    }

    ::placeholder {
      color: #aaaaaa;
    }

    :hover {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;

export { TextareaMessage };
