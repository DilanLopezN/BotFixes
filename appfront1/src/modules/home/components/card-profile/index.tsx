import { FC } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { UserAvatar } from '../../../../ui-kissbot-v2/common';
import { CardProfileProps } from './props';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';

const Content = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    width: 205px;
    height: 82px;
    border-radius: 40px;
    box-shadow: 0px 4px 3px rgb(193 193 193 / 25%);
`;

const Info = styled.div`
    margin: 0 0 0 20px;
    display: flex;
    flex-direction: column;

    span:nth-child(1) {
        font-size: 14px;
        font-weight: 600;
        width: 100px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    span:nth-child(2) {
        font-size: 14px;
    }

    a:nth-child(3) {
        margin: 5px 0 0 0;
        text-align: right;
    }
`;

const CardProfile: FC<CardProfileProps & I18nProps> = ({ getTranslation }) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    return (
        <Content>
            <UserAvatar style={{marginLeft: '-20px'}} user={loggedUser} size={50} hashColor={loggedUser._id} />
            <Info>
                <span title={loggedUser.name}>{loggedUser.name}</span>
                <Link to='/profile' title={getTranslation('Edit profile')}>{getTranslation('Edit profile')}</Link>
            </Info>
        </Content>
    );
};

export default i18n(CardProfile) as FC<CardProfileProps>;
