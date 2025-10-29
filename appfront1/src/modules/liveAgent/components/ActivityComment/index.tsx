import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActivityCommentProps } from './props';
import { ColorType, getColor, ColorVariation } from '../../../../ui-kissbot-v2/theme';
import { formattingWhatsappText } from '../../../../utils/Activity';
import ChatMessageViewed from '../ChatMessageViewed';
import moment from 'moment';
import { Balloon, SendNote, Wrapped } from './styled';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { dispatchWindowEvent } from '../../../../hooks/event.hook';
import { ImReply } from 'react-icons/im';

const ActivityComment: FC<ActivityCommentProps & I18nProps> = ({
    activity,
    ownerMessage,
    renderTimestamp,
    getTranslation,
    conversation,
}) => {
    const { hash, text, timestamp } = activity;
    const activityTimestamp = moment(timestamp);

    const handleReply = () => {
        dispatchWindowEvent('setComponentToActivity', { message: text });
    };

    const activateReplayMessage = (
        <ImReply cursor={'pointer'} onClick={handleReply} title={getTranslation('Send message to input field.')} />
    );

    return (
        <Wrapper>
            <Balloon ownerMessage={ownerMessage} renderTimestamp={renderTimestamp} id={hash}>
                <Wrapper justifyContent='space-between' flexBox>
                    <Wrapped
                        margin='2px 0 0 0'
                        color={'#696969'}
                        style={{
                            wordWrap: 'break-word',
                            display: 'inline-block',
                            maxWidth: '45vw',
                            margin: '0 6px 0 0',
                            color: getColor(ColorType.text, ColorVariation.dark),
                        }}
                        className='balloonWrapper'
                    >
                        {formattingWhatsappText(text)}
                    </Wrapped>
                    <Wrapper flexBox margin='0 0 -7px 0' flexDirection='column' justifyContent='flex-end'>
                        <SendNote>
                            <ChatMessageViewed
                                ack={undefined}
                                activityTimestamp={activityTimestamp}
                                clientMessage={false}
                                showAck={false}
                            />
                            {conversation.whatsappExpiration < 0 ||
                                (!conversation.whatsappExpiration &&
                                    conversation.state === 'open' &&
                                    conversation.assumed &&
                                    activateReplayMessage)}
                        </SendNote>
                    </Wrapper>
                </Wrapper>
            </Balloon>
        </Wrapper>
    );
};

export default i18n(ActivityComment) as FC<ActivityCommentProps>;
