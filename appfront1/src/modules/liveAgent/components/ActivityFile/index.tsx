import { Typography } from 'antd';
import moment from 'moment';
import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from '../../../../ui-kissbot-v2/theme';
import { formattingWhatsappText } from '../../../../utils/Activity';
import { useEmojiReaction } from '../../hooks/use-emoji-reaction';
import { useRenderAttachment } from '../../hooks/use-render-attachment';
import ActivityQuoted from '../ActivityQuoted';
import { EmojiTriggerStyle } from '../ChatMessage/styled';
import ChatMessageViewed from '../ChatMessageViewed';
import { EmojiReactions } from '../EmojiReactions';
import { ActivityFileProps } from './props';
import { Balloon, Wrapped } from './styled';
const { Text } = Typography;

const ActivityFile: FC<ActivityFileProps> = (props) => {
    const {
        activity,
        openImage,
        ownerMessage,
        clientMessage,
        botMessage,
        renderTimestamp,
        quotedActivity,
        scrollToActivity,
        file,
        conversation,
        canReaction,
        emojiVisible,
        setEmojiVisible,
        handleReact,
        handleReply,
    } = props;
    const { localTimestamp, timestamp, hash, ack, type } = activity;
    const activityTimestamp = moment(localTimestamp || timestamp);

    const { attachmentElement } = useRenderAttachment({
        file,
        activity,
        conversation,
        openImage,
        handleReact,
        handleReply,
        canReaction,
        isFilesize: true,
        clientMessage,
    });

    const { handleEmojiSelect } = useEmojiReaction(setEmojiVisible, activity, conversation);

    return (
        <Wrapper position='relative'>
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
                    activityType={type}
                    id={hash}
                >
                    {quotedActivity && <ActivityQuoted activity={quotedActivity} scrollToActivity={scrollToActivity} />}

                    <Wrapper alignItems='center' justifyContent='space-between' flexBox>
                        <Wrapped
                            margin='2px 0 0 0'
                            color={'#696969'}
                            style={{
                                wordWrap: 'break-word',
                                display: 'inline-block',
                                maxWidth: '100%',
                                margin: '0',
                                color: getColor(ColorType.text, ColorVariation.dark),
                            }}
                            className='balloonWrapper'
                        >
                            <Wrapper>{attachmentElement}</Wrapper>
                            {activity.text && (
                                <Text
                                    style={{
                                        padding: '5px 2px 0 2px',
                                        color: 'rgb(68, 68, 68)',
                                        maxWidth: '330px',
                                        minWidth: '230px',
                                        display: 'block',
                                    }}
                                >
                                    {formattingWhatsappText(activity.text)}
                                </Text>
                            )}
                        </Wrapped>
                        <Wrapper
                            flexBox
                            position='absolute'
                            bottom='0'
                            right='5px'
                            flexDirection='column'
                            justifyContent='flex-end'
                        >
                            <ChatMessageViewed
                                ack={ack}
                                activityTimestamp={activityTimestamp}
                                clientMessage={clientMessage}
                            />
                        </Wrapper>
                        {canReaction && clientMessage && (
                            <EmojiTriggerStyle
                                clientMessage={clientMessage}
                                onClick={() => setEmojiVisible(!emojiVisible)}
                            />
                        )}
                    </Wrapper>
                </Balloon>
            </EmojiReactions>
        </Wrapper>
    );
};

export default ActivityFile;
