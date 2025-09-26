import React, { FC } from 'react';
import { EmojiSelectorProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { Popover } from 'antd';
const LazyPicker = React.lazy(() => import('../EmojiPicker'));


const EmojiSelector: FC<EmojiSelectorProps & I18nProps> = ({ onSelect, children, opened, onClose, getTranslation }) => {
    const onSelected = (emoji: any) => {
        return onSelect(emoji.native);
    };

    return (
        <Popover
            overlayInnerStyle={{borderRadius: '10px' }}
            placement='top'
            trigger='click'
            content={
                <div style={{margin: '-12px -16px'}}>
                    <React.Suspense
                        fallback={
                            <Wrapper
                            
                                borderRadius='5px'
                                border='1px #ddd solid'
                                padding='20px'
                                bgcolor='#FFF'
                                width='200px'
                                flexBox
                                justifyContent='center'
                                alignItems='center'
                                height='100px'
                            >
                                {`${getTranslation('Loading')}..`}
                            </Wrapper>
                        }
                    >
                        <LazyPicker onSelected={onSelected} />
                    </React.Suspense>
                </div>
            }
        >
            {children}
        </Popover>
    );
};

export default i18n(EmojiSelector) as FC<EmojiSelectorProps>;
