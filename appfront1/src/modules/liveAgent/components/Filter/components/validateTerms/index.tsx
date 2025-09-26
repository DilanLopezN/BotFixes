import { FC } from 'react';
import { Popover } from 'antd';
import { PrimaryButton } from '../../../../../../ui-kissbot-v2/common';
import { ValidateTermsProps } from './props';
import { Content, Actions } from './styled';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

const ValidateTerms: FC<ValidateTermsProps & I18nProps> = ({
    children,
    onConfirm,
    visible,
    onVisibleChange,
    getTranslation,
    sizeLimit,
}) => {
    return (
        <Popover
            placement='bottomRight'
            onOpenChange={onVisibleChange}
            open={visible}
            trigger='none'
            content={
                <>
                    <Content>
                        <span>
                            {getTranslation('The search text is too long. Use at most')} <b>10</b>{' '}
                            {getTranslation('words')} {getTranslation('or')} <b>{sizeLimit}</b>{' '}
                            {getTranslation('characters')}.
                        </span>
                        <Actions>
                            <PrimaryButton onClick={onConfirm}>{getTranslation('Got it')}</PrimaryButton>
                        </Actions>
                    </Content>
                </>
            }
        >
            <div style={{width: '100%'}}>{children}</div>
        </Popover>
    );
};

export default i18n(ValidateTerms);
