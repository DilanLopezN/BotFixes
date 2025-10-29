import { FC } from 'react';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { InfoRatingProps } from './props';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import '../../style.scss';
import { Rate } from 'antd';
import moment from 'moment';

const InfoRating: FC<InfoRatingProps & I18nProps> = (props) => {
    const { getTranslation, teams, users, info } = props;

    const convertTimestampToNumber = (timestamp) => {
        return typeof timestamp === 'string' ? parseFloat(timestamp) : timestamp;
    };

    return (
        <Wrapper className={'infoRating'}>
            <Wrapper>
                <Wrapper style={{ marginBottom: '5px' }} flexBox justifyContent='center'>
                    <Rate style={{ fontSize: 25 }} disabled defaultValue={info.value} />
                </Wrapper>
                <Wrapper margin='15px 0'>
                    <b>{`${getTranslation('Feedback')}: `}</b>
                    {info.feedback}
                </Wrapper>
            </Wrapper>
            <Wrapper flexBox flexDirection='column'>
                <Wrapper>
                    <b>{`${getTranslation('Assessment date')}: `}</b>
                    {moment(convertTimestampToNumber(info.ratingAt)).format('DD/MM/YYYY [às] HH:mm')}
                </Wrapper>
                <Wrapper>
                    <b>{`${getTranslation('End date of service')}: `}</b>
                    {moment(convertTimestampToNumber(info.createdAt)).format('DD/MM/YYYY [às] HH:mm')}
                </Wrapper>
                <Wrapper width='50%'>
                    <b>{`${getTranslation('Team')}: `}</b>
                    {teams.find((team) => team._id === info.teamId)?.name}
                </Wrapper>
                <Wrapper>
                    <b>{`${getTranslation('Agent')}: `}</b>
                    {users.find((user) => user._id === info.userId)?.name}
                </Wrapper>
            </Wrapper>
        </Wrapper>
    );
};

export default i18n(InfoRating) as FC<InfoRatingProps>;
