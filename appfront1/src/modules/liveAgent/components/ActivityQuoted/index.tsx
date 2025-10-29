import { FC } from 'react'
import { Wrapper, Icon } from '../../../../ui-kissbot-v2/common'
import { ActivityQuotedProps } from './props'
import styled from 'styled-components';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { activityIsCard } from '../../../../utils/Activity';
import { AttachmentService } from '../../service/Atttachment.service';

const stringToColor = str => {
    const colors = [
        '#40407a', '#706fd3', '#34ace0', '#33d9b2',
        '#474787', '#227093', '#218c74',
        '#ff5252', '#ff793f', '#ffb142',
        '#b33939', '#cd6133', '#84817a', '#cc8e35',
    ] as string[];

    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
        hash = hash & hash
    }

    hash = ((hash % colors.length) + colors.length) % colors.length
    return colors[hash] as string;
}

const Wrapped = styled(Wrapper)`
    border-left: 3px #61c0bf solid;
    border-radius: .4em;
    margin: 0 0 7px 0;
    background: #f9f9f9;
    cursor: pointer;
    min-width: 95px;
`;

const ActivityQuoted: FC<ActivityQuotedProps & I18nProps> = ({
    activity,
    scrollToActivity,
    getTranslation
}) => {

    const {
        attachment,
        attachmentFile,
        type
    } = activity;

    const file = attachment || attachmentFile;
    const isFileActivity = !!file && (type === 'member_upload_attachment' || !!attachment);

    const fromColor = '' + stringToColor(activity.from?.id) || '#555';

    return (
        <Wrapped
            onClick={() => scrollToActivity(activity.hash)}>
            {isFileActivity
                ? <Wrapper
                    minWidth='120px'
                    flexBox
                    justifyContent='space-between'
                    padding='7px'>

                    {AttachmentService.isImageFile(file.contentType) ? (
                        <div>
                            <Wrapper>
                                <Wrapper
                                    margin='0 0 5px 0'
                                    color={fromColor}
                                    truncate
                                    fontWeight='600'>
                                    {activity.from.name}
                                </Wrapper>
                                <Wrapper
                                    flexBox
                                    fontSize='13px'>
                                    <Icon size='12' name='camera' />
                                    <span
                                        style={{
                                            margin: '0 0 0 3px'
                                        }}>{getTranslation('Photo')}</span>
                                </Wrapper>
                            </Wrapper>
                            <Wrapper
                                margin='0 0 0 10px'
                            >
                                <img
                                    style={{
                                        width: '55px',
                                        borderRadius: '5px',
                                        objectFit: 'cover',
                                        height: '45px'
                                    }}
                                    alt=''
                                    src={AttachmentService.createAttachmentUrl(activity.conversationId, file.id)}
                                />
                            </Wrapper>
                        </div>
                    ) : <Wrapper>
                        <Wrapper>
                            <Wrapper
                                margin='0 0 5px 0'
                                color={fromColor}
                                truncate
                                fontWeight='600'>
                                {activity.from.name}
                            </Wrapper>
                            <Wrapper
                                flexBox
                                fontSize='13px'>
                                <Icon size='12' name='text-box' />
                                <span
                                    style={{
                                        margin: '0 0 0 3px'
                                    }}>{getTranslation('File')}</span>
                            </Wrapper>
                        </Wrapper>
                    </Wrapper>}
                </Wrapper>
                : activityIsCard(activity)
                    ? <Wrapper
                        padding='7px'>
                        <Wrapper
                            margin='0 0 5px 0'
                            color={fromColor}
                            truncate
                            fontWeight='600'>
                            {activity.from.name}
                        </Wrapper>
                        <Wrapper
                            flexBox
                            fontSize='13px'>
                            <Icon size='12' name='card-text' />
                            <span
                                style={{
                                    margin: '0 0 0 3px'
                                }}>{getTranslation('Card')}</span>
                        </Wrapper>
                    </Wrapper>
                    : <Wrapper
                        padding='7px'>
                        <Wrapper
                            margin='0 0 5px 0'
                            color={fromColor}
                            truncate
                            fontWeight='600'>
                            {activity.from.name}
                        </Wrapper>
                        <Wrapper
                            fontSize='13px'>
                            {activity.text}
                        </Wrapper>
                    </Wrapper>}
        </Wrapped>
    )
}

export default i18n(ActivityQuoted) as FC<ActivityQuotedProps>
