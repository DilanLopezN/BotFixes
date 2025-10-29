import { I18nProps } from '../../modules/i18n/interface/i18n.interface';

export interface ModalConfirmProps extends I18nProps {
    onAction: (...params) => any;
    isOpened: boolean;
    children?: React.ReactNode;
    onCancelText?: string;
    onConfirmText?: string;
}
