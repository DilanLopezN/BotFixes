import { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { CustomBadge } from '../Common/common';
import styled from 'styled-components';
import moment from 'moment';
import { ConversationCardProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { ConversationStatus } from 'kissbot-core';

const Wrap = styled(Wrapper)`
    -moz-box-shadow: -7px 8px 10px -10px rgba(0, 0, 0, 0.4);
    box-shadow: -7px 8px 10px -10px rgba(0, 0, 0, 0.4);
`;

const ConversationCardResume: FC<ConversationCardProps> = ({
    conversation,
    onViewClick,
    selectedConversation,
    getTranslation,
}) => {
    const getColorStatus = () => {
        switch (conversation.state) {
            case ConversationStatus.open:
                return '#1ea54db8';

            case ConversationStatus.closed:
                return '#e6121296';
        }
    };

    return (
        <Wrap
            title={conversation.state}
            flexBox
            borderRadius='3px 0 0 3px'
            padding='4px 8px'
            margin='10px 0'
            cursor='pointer'
            justifyContent='space-between'
            flexDirection='column'
            borderRight={`3px ${getColorStatus()} solid`}
            borderBottom='1px #ddd solid'
            style={{
                background:
                    conversation && selectedConversation && conversation._id === selectedConversation._id
                        ? '#e9ebeb'
                        : '#fff',
            }}
            onClick={() => onViewClick(conversation._id)}
        >
            <Wrapper flexBox margin='2px 0' alignItems='center' fontSize='13px'>
                <Wrapper>{`${getTranslation('Started in')}:`}</Wrapper>
                <Wrapper margin='0 5px 0 8px' color='#666' flexBox fontSize='13px'>
                    <span>{moment(conversation.createdAt).calendar()}</span>
                </Wrapper>
            </Wrapper>
            <Wrapper flexBox margin='2px 0' alignItems='center' fontSize='13px'>
                <Wrapper>{`${getTranslation('ID')}:`}</Wrapper>
                <Wrapper margin='0 5px 0 8px' color='#666' flexBox fontSize='13px'>{`#${conversation.iid}`}</Wrapper>
            </Wrapper>
            {conversation?.tags.length > 0 && (
                <Wrapper flexBox margin='2px 0' alignItems='center' fontSize='13px'>
                    <Wrapper>Tags:</Wrapper>
                    <Wrapper width='100%'>
                        <div
                            style={{
                                display: 'inline-flex',
                                flexWrap: 'wrap',
                                margin: '0 0 0 8px',
                                maxWidth: '85%',
                            }}
                        >
                            {conversation.tags.map((tag) => (
                                <CustomBadge notTagName key={tag?._id} tag={tag} />
                            ))}
                        </div>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrap>
    );
};

export default I18n(ConversationCardResume);
