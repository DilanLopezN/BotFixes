import { FC } from 'react'
import { I18nProps } from "../../../../../i18n/interface/i18n.interface"
import i18n from '../../../../../i18n/components/i18n'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common'
import { Rate, Card, Progress } from 'antd'
import '../../style.scss';
import { AvgRating } from '../RatingList/props'


interface InfoAvgRatingsProps {
    loading: boolean;
    infoAvgRating: AvgRating;
}

const InfoAvgRatings: FC<InfoAvgRatingsProps & I18nProps> = ({
    getTranslation,
    loading,
    infoAvgRating,
}) => {

    return <>
        <Wrapper
            flexBox
            width='100%'
            minWidth='1000px'
            maxWidth='1300px'
            margin='0 auto'
        >
            <Card loading={loading} style={{ width: '550px', borderRadius: '10px', marginBottom: '20px' }}>
                <Wrapper flexBox>
                    <Wrapper
                        flexBox
                        alignItems='flex-end'
                        flexDirection='column'
                        width='38%'
                        margin='0 40px 0 0'
                    >
                        <h1 style={{ margin: 0 }}>{infoAvgRating?.avg}</h1>
                        <Rate key={`${infoAvgRating.count} ${infoAvgRating.avg}`} className={'infoAvgRating'} disabled allowHalf defaultValue={Math.round(infoAvgRating?.avg / 0.5) * 0.5} />
                        <Wrapper fontSize='13px' margin='5px 0 0 0'>{`${getTranslation('Average between')} ${infoAvgRating?.count || 0} ${getTranslation('Ratings').toLocaleLowerCase()}`}</Wrapper>
                    </Wrapper>
                    <Wrapper width='47%' flexBox>
                        <Wrapper margin='0 10px 0 0' width='110px'>
                            <Wrapper>{`5 ${getTranslation('stars')}`}</Wrapper>
                            <Wrapper>{`4 ${getTranslation('stars')}`}</Wrapper>
                            <Wrapper>{`3 ${getTranslation('stars')}`}</Wrapper>
                            <Wrapper>{`2 ${getTranslation('stars')}`}</Wrapper>
                            <Wrapper>{`1 ${getTranslation('star')}`}</Wrapper>
                        </Wrapper>
                        <Wrapper width='165px'>
                            <Progress
                                showInfo={false}
                                percent={Math.round(100 * infoAvgRating.values.note5 / infoAvgRating.count)}
                            />
                            <Progress
                                showInfo={false}
                                percent={Math.round(100 * infoAvgRating.values.note4 / infoAvgRating.count)}
                            />
                            <Progress
                                showInfo={false}
                                percent={Math.round(100 * infoAvgRating.values.note3 / infoAvgRating.count)}
                            />
                            <Progress
                                showInfo={false}
                                percent={Math.round(100 * infoAvgRating.values.note2 / infoAvgRating.count)}
                            />
                            <Progress
                                showInfo={false}
                                percent={Math.round(100 * infoAvgRating.values.note1 / infoAvgRating.count)}
                            />
                        </Wrapper>
                        <Wrapper margin='0 0 0 10px' width='90px'>
                            <Wrapper>{`${infoAvgRating.values.note5}`}</Wrapper>
                            <Wrapper>{`${infoAvgRating.values.note4}`}</Wrapper>
                            <Wrapper>{`${infoAvgRating.values.note3}`}</Wrapper>
                            <Wrapper>{`${infoAvgRating.values.note2}`}</Wrapper>
                            <Wrapper>{`${infoAvgRating.values.note1}`}</Wrapper>
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            </Card>
        </Wrapper>
    </>
}

export default i18n(InfoAvgRatings) as FC<InfoAvgRatingsProps>;