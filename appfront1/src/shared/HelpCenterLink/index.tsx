import { CSSProperties, FC } from 'react';
import { RiQuestionLine } from 'react-icons/ri';
import i18n from '../../modules/i18n/components/i18n';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import { TextLink } from '../TextLink/styled';

export interface HelpCenterLinkProps {
    title?: string;
    article: string | undefined;
    style?: CSSProperties;
    textStyle?: CSSProperties;
    text?: string;
    iconPosition?: 'left' | 'right';
}

const HelpCenterLink: FC<HelpCenterLinkProps & I18nProps> = (props) => {
    const { article, getTranslation, iconPosition = 'right', style = {}, text, textStyle, title = '' } = props;
    const link = `https://botdesigner.freshdesk.com/${
        article ? `support/solutions/articles/${article}` : ''
    }`;

    const Icon = <RiQuestionLine style={{ ...style, fontSize: '15px', margin: '0 5px' }} />;

    return (
        <TextLink style={{display: 'flex', alignItems: 'center'}} href={link} target={'_blank'} title={title || getTranslation('Navigate to article')}>
            {iconPosition === 'left' ? Icon : null}
            {text && <span style={{ ...textStyle }}>{text}</span>}
            {iconPosition === 'right' ? Icon : null}
        </TextLink>
    );
};

export default i18n(HelpCenterLink) as FC<HelpCenterLinkProps>;
