import { FC } from 'react';
import { Icon } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Badge, ButtonWrapper, ScrollButton } from './style';

interface ScrollToBottomButtonProps {
    visible: boolean;
    onClick: () => void;
    unreadCount?: number;
}

const ScrollToBottomButtonComponent: FC<ScrollToBottomButtonProps & I18nProps> = ({
    getTranslation,
    visible,
    onClick,
    unreadCount = 0,
}) => {
    return (
        <ButtonWrapper visible={visible}>
            <ScrollButton onClick={onClick} title={getTranslation('Scroll to bottom')}>
                <Icon name='chevron-down' size='24px' color='#FFF' />
                {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
            </ScrollButton>
        </ButtonWrapper>
    );
};

export const ScrollToBottomButton = i18n(ScrollToBottomButtonComponent);
