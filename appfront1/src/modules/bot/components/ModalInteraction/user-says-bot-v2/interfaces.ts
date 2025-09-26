import { IPart } from 'kissbot-core';
import { IUserSay } from '../../../../../model/Interaction';
import { DraftType } from '../../../../../shared-v2/flex-text-editor/enum/draft-type.enum';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';

interface EntityData {
    value: string;
    variable?: IPart;
}
type FragmentType = 'TEXT' | 'VARIABLE';

export interface Entity {
    type: FragmentType;
    mutability: DraftType;
    data: EntityData;
}

export interface EntityMap {
    [key: string]: Entity;
}

export interface Fragment {
    type: FragmentType;
    value: string;
    variableName?: string;
}

export interface UserSaysBotProps extends I18nProps {
    userSays: IUserSay[];
    isSubmitted: boolean;
    isValidUserSays: boolean | undefined;
    onChangeInput: (userSaysAsString: Array<IUserSay>, isValid: boolean) => void;
}

export interface IPartId extends IPart {
    id?: string;
}

export type Interval = { start: number; end: number } | { start: number; end: number; entityKey: string };
