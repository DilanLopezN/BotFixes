import { AiOutlineBold, AiOutlineItalic } from 'react-icons/ai';
import { BiCodeAlt, BiHappy } from 'react-icons/bi';
import { BsTypeStrikethrough } from 'react-icons/bs';
import { RiBracesLine } from 'react-icons/ri';
import styled, { css, CSSObject } from 'styled-components';
import { IconProps, ToolbarProps } from './props';

const BoldIcon = styled(AiOutlineBold)`
    width: 20px;
    height: 20px;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

const ItalicIcon = styled(AiOutlineItalic)`
    width: 20px;
    height: 20px;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

const StrukeIcon = styled(BsTypeStrikethrough)`
    width: 20px;
    height: 20px;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

const MonospaceIcon = styled(BiCodeAlt)`
    width: 20px;
    height: 20px;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

export const PencilAiIcon = styled.img`
    height: 16px;
    filter: brightness(0) saturate(100%) invert(39%) sepia(0%) saturate(0%) hue-rotate(166deg) brightness(92%)
        contrast(84%);
    cursor: pointer;
    transition: filter 0.2s ease;

    &:hover {
        filter: brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%)
            contrast(100%);
    }
`;

const VariableIcon = styled(RiBracesLine)`
    width: 20px;
    height: 20px;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

const EmoticonIcon = styled(BiHappy)`
    height: 18px;
    width: 18px;
    color: #666;
    margin: 5px;
    cursor: pointer;

    &:hover {
        color: #000;
    }
`;

const ControlsContent = styled('div')`
    margin: 4px 4px 0 0;
    display: flex;
    justify-content: flex-end;
    position: relative;
    overflow: hidden !important;
`;

const EditorContent = styled('div')`
    border: 1px solid #d9d9d9;
    min-height: 100px;
    max-height: 400px;
    padding: 10px;
    resize: vertical;
    border-radius: 5px;
    overflow: auto;
    cursor: text;

    :hover {
        border: 1px solid rgba(3, 102, 214, 0.6) !important;
    }
    :focus-within {
        border: 1px solid rgba(3, 102, 214, 0.6) !important;
    }
`;

export { BoldIcon, ControlsContent, EditorContent, EmoticonIcon, ItalicIcon, MonospaceIcon, StrukeIcon, VariableIcon };

export const Icon = styled.div<IconProps>`
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 30px;
    background-color: ${(props) => (props.active ? '#e0e0e0' : 'transparent')};

    &:hover {
        background-color: ${(props) => (props.active ? '#d0d0d0' : '#f0f0f0')};
    }
`;

export const CharacterCounter = styled.div`
    font-size: 14px;
    border-radius: 4px;
    padding: 5px 10px;
    display: flex;
    align-items: center;
`;

const toCSSObject = (style?: React.CSSProperties): CSSObject => {
    if (!style) return {};
    return Object.entries(style).reduce((acc, [key, value]) => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        acc[kebabKey] = value;
        return acc;
    }, {} as CSSObject);
};

export const StyledToolbar = styled.div<ToolbarProps>`
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    justify-content: space-between;
    height: 40px;

    ${(props) => css(toCSSObject(props.toolbarStyle))}

    visibility: ${(props) => (props.toolbarShow ? 'visible' : 'hidden')};
    z-index: ${(props) => (props.toolbarShow ? '999' : '-999')};

    &:focus {
        outline: none;
    }

    [aria-hidden='true'] {
        display: none;
    }
`;
