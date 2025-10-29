import moment from 'moment';
import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from '../../../../ui-kissbot-v2/theme';
import { formattingWhatsappText } from '../../../../utils/Activity';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import { useLanguageContext } from '../../../i18n/context';
import { useEmojiReaction } from '../../hooks/use-emoji-reaction';
import ActivityQuoted from '../ActivityQuoted';
import { EmojiTriggerStyle } from '../ChatMessage/styled';
import ChatMessageViewed from '../ChatMessageViewed';
import { EmojiReactions } from '../EmojiReactions';
import { ActivityTextProps } from './props';
import { Balloon, MaxWidth, Wrapped } from './styled';

const ActivityText: FC<ActivityTextProps> = ({
    clientMessage,
    botMessage,
    activity,
    quotedActivity,
    ownerMessage,
    renderTimestamp,
    scrollToActivity,
    loggedUser,
    conversation,
    setEmojiVisible,
    emojiVisible,
    canReaction,
}) => {
    const { ack, hash, text, localTimestamp, timestamp } = activity;
    const activityTimestamp = moment(localTimestamp || timestamp);
    const { getTranslation } = useLanguageContext();

    const { handleEmojiSelect } = useEmojiReaction(setEmojiVisible, activity, conversation);

    return (
        <Wrapper position='relative'>
            {isAnySystemAdmin(loggedUser) &&
                activity.from.type === 'bot' &&
                activity?.recognizerResult?.interactionId && (
                    <Wrapper
                        position='absolute'
                        right='23px'
                        top='-3px'
                        cursor='pointer'
                        title={'Ir para interação'}
                        style={{ zIndex: 5 }}
                    >
                        <a
                            href={`/workspace/${activity.workspaceId}/bot/${activity.from.id}/interaction/${activity?.recognizerResult?.interactionId}`}
                            target={'_blank'}
                            rel='noreferrer'
                        >
                            <img
                                alt={getTranslation('Arrow')}
                                style={{ width: '11px', height: '11px' }}
                                src='/assets/img/arrow.png'
                            />
                        </a>
                    </Wrapper>
                )}
            <EmojiReactions
                clientMessage={clientMessage}
                visible={emojiVisible}
                onClose={() => setEmojiVisible(false)}
                onSelectEmoji={handleEmojiSelect}
            >
                <Balloon
                    ownerMessage={ownerMessage}
                    clientMessage={clientMessage}
                    botMessage={botMessage}
                    renderTimestamp={renderTimestamp}
                    id={hash}
                >
                    {quotedActivity && <ActivityQuoted scrollToActivity={scrollToActivity} activity={quotedActivity} />}

                    <Wrapper justifyContent='space-between' flexBox>
                        <MaxWidth>
                            <Wrapped
                                margin='2px 0 0 0'
                                color={'#c41c1c'}
                                style={{
                                    color: getColor(ColorType.text, ColorVariation.dark),
                                }}
                                className='balloonWrapper'
                            >
                                {formattingWhatsappText(activity?.data?.replyTitle || text)}
                            </Wrapped>
                        </MaxWidth>

                        <Wrapper flexBox margin='0 0 -7px 0' flexDirection='column' justifyContent='flex-end'>
                            <ChatMessageViewed
                                ack={ack}
                                activityTimestamp={activityTimestamp}
                                clientMessage={clientMessage}
                            />

                            {canReaction && clientMessage && (
                                <EmojiTriggerStyle
                                    clientMessage={clientMessage}
                                    onClick={() => setEmojiVisible(!emojiVisible)}
                                />
                            )}
                        </Wrapper>
                    </Wrapper>
                </Balloon>
            </EmojiReactions>
        </Wrapper>
    );
};

export default ActivityText;
