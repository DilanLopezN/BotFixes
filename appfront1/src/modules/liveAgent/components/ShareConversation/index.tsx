import { FC } from 'react';
import Copy from '../../../../shared/Copy';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ShareConversationProps } from './props';
import { useWindowSize } from '../../hooks/use-window-size';
import { breakpoint } from '../ChatContainerHeader';
import { message } from 'antd';
declare var window: any;

const ShareConversation: FC<ShareConversationProps & I18nProps> = ({ getTranslation, conversation, workspaceId }) => {
    const windowSize = useWindowSize();
    const isSmallScreen = windowSize.width < breakpoint;
    const copyTextToClipboard = () => {
        if (!conversation || !document.hasFocus()) {
            return;
        }

        const text = `${window.location.origin}/live-agent?workspace=${workspaceId}&conversation=${conversation._id}`;
        if (!navigator.clipboard) {
            return fallbackCopyTextToClipboard(text);
        }
        navigator.clipboard
            .writeText(text)
            .then(() => {
                message.success('Link copiado com sucesso!');
            })
            .catch(() => {
                message.error('Erro ao copiar o link');
            });
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            document.execCommand('copy');
            document?.body?.removeChild(textArea);
        } catch (err) {}
    };

    return (
        <Wrapper flexBox alignItems='center' title={getTranslation('Share service')}>
            <Copy
                id='copy'
                title={getTranslation('Copy')}
                duration={1000}
                placement={'bottomRight'}
                onClick={() => copyTextToClipboard()}
                className='mdi md-24px mdi-share-variant'
                style={{
                    cursor: 'pointer',
                    fontSize: '24px',
                }}
            />
            {isSmallScreen && (
                <span onClick={() => copyTextToClipboard()} style={{ marginLeft: 8 }}>
                    {getTranslation('Compartilhar')}
                </span>
            )}
        </Wrapper>
    );
};

export default i18n(ShareConversation) as FC<ShareConversationProps>;
