import { FC } from 'react';
import styled from 'styled-components';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';

const Content = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin: 30px 0 0 0;

    img {
        height: 200px;
    }

    p {
        margin: 30px 0 0 0;
        color: #555;
        text-align: center;

        span {
            display: block;
        }
    }
`;

interface RestrictedAccessProps { }

const RestrictedAccess: FC<RestrictedAccessProps & I18nProps> = ({ getTranslation }) => {
    return (
        <Content>
            <img src='/assets/img/undraw_authentication.svg' />
            <p>
                <span>{getTranslation('You do not have access to this page on your')} <b>{getTranslation('current location')}</b>.</span>
            </p>
        </Content>
    )
}

export default i18n(RestrictedAccess) as FC<RestrictedAccessProps>;
