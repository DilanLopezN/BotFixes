import { I18nProps } from './../../../../i18n/interface/i18n.interface';

export interface TypingDelayProps extends I18nProps {
    onChange: (...params) => any;
    onSendTyppingChange: (...params) => any;
    typingDelay: number;
    sendTyping: boolean;
}
export interface TypingDelayState {
    isModalOpened: boolean;
}