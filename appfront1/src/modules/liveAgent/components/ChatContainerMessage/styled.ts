import styled from 'styled-components';
import { getColor, ColorType, ColorVariation } from '../../../../ui-kissbot-v2/theme';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { AiOutlinePaperClip } from 'react-icons/ai';
import { IoMdSend } from 'react-icons/io';
import { BiHappy } from 'react-icons/bi';
import { CgFormatItalic } from 'react-icons/cg';

const Footer = styled(Wrapper)`
    padding: 5px 20px;
    background: transparent;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const TextareaContainer = styled(Wrapper)<{ disabled: boolean }>`
    width: 100%;
    position: relative;
    border-radius: 0.3em;

    ${({ disabled }) =>
        disabled &&
        `
    pointer-events: none;
  `};
`;

const TextareaMessage = styled.textarea`
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: none;
    min-height: 66px !important;
    border-radius: 0.3em 0.3em 0 0;
    background: #fff;
    outline: none;
    overflow-y: scroll;
    max-height: 167px;
    color: ${getColor(ColorType.text, ColorVariation.dark)};
    resize: none;
    border-bottom: 1px #efefef solid;
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
`;

const TextareaButton = styled(Wrapper)`
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-60%);
`;

const EmoticonIcon = styled(BiHappy)`
    height: 20px;
    width: 20px;
    color: #666;
    margin: 0 5px;
    cursor: pointer;
`;

const FileIcon = styled(AiOutlinePaperClip)`
    height: 20px;
    width: 20px;
    color: #666;
    margin: 0 5px;
    cursor: pointer;
`;

const SendIcon = styled(IoMdSend)<{ disabled: boolean }>`
    height: 20px;
    width: 20px;
    color: #666;
    margin: 0 0 0 20px;
    cursor: pointer;
`;

const TemplateIcon = styled(CgFormatItalic)`
    height: 20px;
    width: 20px;
    color: #666;
    margin: 0 5px;
    cursor: pointer;
`;

const MessageType = styled(Wrapper)`
    font-weight: 600;
    font-size: 13px;
    color: #777;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-top: 1px transparent solid;
    margin: 1px 3px 0 3px;
    padding: 0 4px 0 4px;
`;

const MessageTypeButton = styled(MessageType)`
    &.active {
        color: #0a48b5;
        border-top: 1px #3f66ab solid;
    }
`;

const CommentTypeButton = styled(MessageType)`
    &.active {
        color: #0a48b5;
        border-top: 1px #3f66ab solid;
    }
`;

export const StyledDiv = styled.div`
    margin-bottom: 10px;
    font-size: 14px;
    color: #666;
    padding: 10px;
    background: #f7f7f7;
    border: 1px solid #efefef;
    border-radius: 8px;
`;

export {
    TextareaButton,
    EmoticonIcon,
    FileIcon,
    SendIcon,
    TemplateIcon,
    TextareaContainer,
    Footer,
    TextareaMessage,
    MessageTypeButton,
    CommentTypeButton,
};
