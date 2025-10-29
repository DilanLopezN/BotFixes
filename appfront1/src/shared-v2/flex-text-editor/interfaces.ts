import { ContentState } from 'draft-js';
import { IPart } from 'kissbot-core';
import { Dispatch, SetStateAction } from 'react';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import { FlexTextType } from './enum/flex-text-type.enum';

export interface DraftDecoratorsBlockProps extends I18nProps {
    props: any;
    typeBlock: FlexTextType;
    setOpenEditVariable: Dispatch<SetStateAction<boolean>>;
    onChangeVariableBlock: (iPart: IPart, start: number, end: number) => void;
    userSaysParts: IPart[];
}

export interface FlexTextEditorProps {
    initialText: string;
    maxLength: number;
    disabled: boolean;
    typeBlock: FlexTextType;
    userSaysParts?: IPart[];
    onEntityChange: (contentState: ContentState) => void;
    isHsm?: boolean;
    onChangeVariable?: (variable) => void;
    variables?: any[];
    onFocus?: Function;
    toolbarOnFocus?: boolean;
    toolbarHidden?: boolean;
    toolbar?: object;
    initialContent?: ContentState;
}
