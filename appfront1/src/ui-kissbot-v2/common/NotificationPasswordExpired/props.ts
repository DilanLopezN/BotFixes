import { I18nProps } from '../../../modules/i18n/interface/i18n.interface';

export interface NotificationPasswordExpiredProps extends I18nProps {
    setLocalStorage: Function;
    expirationDate: string;
}
