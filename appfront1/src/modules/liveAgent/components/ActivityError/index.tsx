import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActivityErrorProps } from './props';
import { formattingWhatsappText } from '../../../../utils/Activity';
import { Balloon, Wrapped } from './styled';

const ActivityError: FC<ActivityErrorProps> = ({ clientMessage, activity, ownerMessage, renderTimestamp }) => {
    const { hash, text } = activity;

    return text !== '' ? (
        <Wrapper>
            <Balloon
                ownerMessage={ownerMessage}
                clientMessage={clientMessage}
                renderTimestamp={renderTimestamp}
                id={hash}
            >
                <Wrapper justifyContent='space-between' flexBox>
                    <Wrapped
                        margin='2px 0 0 0'
                        color='#FFF'
                        style={{
                            wordWrap: 'break-word',
                            display: 'inline-block',
                            maxWidth: '45vw',
                            margin: '0 6px 0 0',
                        }}
                        className='balloonWrapper'
                    >
                        {formattingWhatsappText(text)}
                    </Wrapped>
                </Wrapper>
            </Balloon>
        </Wrapper>
    ) : null;
};

export default ActivityError;
