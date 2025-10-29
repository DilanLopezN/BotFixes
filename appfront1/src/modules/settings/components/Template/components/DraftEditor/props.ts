import { DetailedHTMLProps, HTMLProps, ReactNode } from 'react';
import { TemplateCategory, TemplateVariable } from '../../../../../liveAgent/components/TemplateMessageList/interface';

export enum InlineStyleType {
    BOLD = 'BOLD',
    ITALIC = 'ITALIC',
    STRIKETHROUGH = 'STRIKETHROUGH',
    CODE = 'CODE',
    VARIABLE = 'VARIABLE',
    AI_SUGGESTION = 'AI_SUGGESTION',
    AI_INSIGHT = 'AI_INSIGHT',
}
export interface CharacterCounterProps {
    isMaxReached: boolean;
}

export type ActiveModal = null | InlineStyleType.AI_SUGGESTION | InlineStyleType.AI_INSIGHT;

export interface InlineStyleItem {
    style: InlineStyleType;
    label: ReactNode;
    tooltip: string;
}

export interface DraftEditorProps {
    initialValue: string;
    maxLength: number;
    variables: TemplateVariable[];
    onChange: (value: string) => void;
    onChangeVariable: (variable: TemplateVariable) => void;
    isHsm: boolean;
    disabled: boolean;
    onFocus?: Function;
    toolbarOnFocus?: boolean;
    onBlur?: Function;
    setActiveModal: React.Dispatch<React.SetStateAction<ActiveModal>>;
    templateCategory?: TemplateCategory;
}
export interface IconProps extends DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement> {
    active?: boolean;
}
export interface ToolbarProps {
    toolbarClassName?: string;
    toolbarStyle?: React.CSSProperties;
    toolbarShow: boolean;
    editorFocused?: boolean;
    toolbarOnFocus?: boolean;
    preventDefault?: React.MouseEventHandler<HTMLDivElement>;
    controlProps?: React.ComponentProps<any>;
    toolbarCustomButtons?: React.ReactElement[];
}
