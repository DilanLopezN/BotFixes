
import styled from 'styled-components';
import TextAreaAutoSize from '../ChatContainerMessage/textarea-auto-size';
import { ColorType, ColorVariation, getColor } from '../../../../ui-kissbot-v2/theme';

const TextareaInput = styled(TextAreaAutoSize)`
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 40px 10px 10px;
    border: none;
    border-radius: .3em .3em 0 0;
    &:disabled {
    cursor: initial;
    }
    outline: none;
    min-height: 66px;
    overflow-y: scroll;
    max-height: 167px;
    color: ${getColor(ColorType.text, ColorVariation.dark)};
    resize: none;
    font-size: 14px;

    &::-webkit-scrollbar {
    width: 0;
    }

    &::-webkit-scrollbar-track {
    background : transparent;
    border-radius: 0px;
    }

    &::-webkit-scrollbar-thumb {
    border-radius: 0px;
    }
`
export {
    TextareaInput,
}