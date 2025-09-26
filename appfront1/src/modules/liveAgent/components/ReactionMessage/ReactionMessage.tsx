import { Tooltip } from 'antd';
import { IdentityType } from 'kissbot-core';
import { FC } from 'react';
import styled from 'styled-components';
import { useLanguageContext } from '../../../i18n/context';

const ContentReaction = styled.div<{ clientMessage?: boolean }>`
    background: #ffffff;
    border-radius: 18px;
    padding: 4px 6px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-size: 12px;
    line-height: 1;
    color: #000;
    position: absolute;

    ${(props) => (props.clientMessage ? `margin-top: -4px;` : `margin-top: -14px;`)}
    z-index: 1;
    border-top: 1.3px solid rgba(0, 0, 0, 0.2);
    ${(props) => (props.clientMessage ? `margin-left: 18px;` : `margin-left: 0px;`)}
`;

export interface ReactionMessageProps {
    reactions: string[];
    clientMessage?: boolean;
}

export const ReactionMessage: FC<ReactionMessageProps> = ({ reactions, clientMessage }) => {
    const { getTranslation } = useLanguageContext();

    return (
        <>
            {reactions.length > 0 &&
                reactions.some((reaction) => {
                    const emojiPart = reaction.split(', emoji: ')[1];
                    return emojiPart && emojiPart.trim() !== ''; 
                }) && (
                    <ContentReaction clientMessage={clientMessage}>
                        {reactions.map((reaction, index) => {
                            const [typeAndName, emojiPart] = reaction.split(', emoji: ');
                            const [type, name] = typeAndName.split(': ');

                            const tooltipText =
                                type === IdentityType.user
                                    ? `${name} ${getTranslation('reacted to the message')}`
                                    : `${name} ${getTranslation('reacted to the message')}`;

                            return (
                                <Tooltip key={index} title={tooltipText} placement='bottom'>
                                    <span style={{ cursor: 'default' }}>{emojiPart}</span>
                                </Tooltip>
                            );
                        })}
                    </ContentReaction>
                )}
        </>
    );
};
