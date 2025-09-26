import { TooltipPlacement } from 'antd/es/tooltip';
import { ColorType } from './../../../../ui-kissbot-v2/theme/colors';
import { I18nProps } from './../../../i18n/interface/i18n.interface';

export interface ConfirmPopoverProps extends I18nProps {
    onClick?: Function;
    onConfirm: Function;
    text?: string;
    component?: any;
    opened?: boolean;
    maxWidth?: number;
    confirmColorType: ColorType;
    children?: React.ReactNode;
    placements: TooltipPlacement | 'bottom';
    setIsModalVisible?: Function;
    disabled?: boolean;
}
