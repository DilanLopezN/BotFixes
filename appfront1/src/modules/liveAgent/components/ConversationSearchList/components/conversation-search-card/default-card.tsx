import { ConversationStatus, User } from 'kissbot-core';
import moment from 'moment';
import { FC } from 'react';
import { ConversationSearchResult } from '../../../../interfaces/conversation.interface';
import { Card, ContactIcon, AttributeIcon, Tag, TagsWrapper } from './styled';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';

interface DefaultCardProps {
    conversationResult: ConversationSearchResult;
    onSelectConversation: (resultSearchId: string, conversationId: string) => void;
    selected: boolean;
    loggedUser: User;
    getTranslation: any;
    canViewConversation: boolean;
    children?: React.ReactNode;
}

const DefaultCard: FC<DefaultCardProps & I18nProps> = ({
    conversationResult,
    selected,
    children,
    onSelectConversation,
    loggedUser,
    canViewConversation,
    getTranslation,
}) => {
    const { conversation } = conversationResult;

    const filterTags = (tags) => {
        const isAnyAdmin = isAnySystemAdmin(loggedUser);
        const listTags = tags.filter((tag) => {
            return isAnyAdmin ? tag : !tag.name.includes('@sys') && tag;
        });

        return listTags;
    };

    const borderStyle = (): string => {
        if (conversation.state === ConversationStatus.closed) {
            return '#f12727';
        }
        if (
            conversation.state === ConversationStatus.open &&
            conversation.suspendedUntil &&
            conversation.suspendedUntil > moment().valueOf()
        ) {
            return '#faad14';
        }

        return '';
    };

    const getResultOrigin = () => {
        if (conversationResult.dataType === 2) {
            return (
                <>
                    <ContactIcon style={{ margin: '0 5px 0 0' }} />
                    {getTranslation('Contact')}
                </>
            );
        } else if (conversationResult.dataType === 1) {
            return (
                <>
                    <AttributeIcon style={{ margin: '0 5px 0 0' }} />
                    {getTranslation('Attribute')}
                </>
            );
        } else {
            return null;
        }
    };

    return (
        <Card
            selected={selected}
            statusBorderColor={borderStyle()}
            onClick={() => onSelectConversation(conversationResult.id, conversationResult.conversationId)}
        >
            <div style={{ margin: '0 0 7px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>
                        <b style={{ fontSize: '16px' }}>#</b>
                        <b>{conversation.iid} - </b>
                        <span style={{ fontWeight: 'unset', fontSize: '12px' }}>
                            {moment(conversationResult.conversation.createdAt).fromNow(true)}
                        </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>{getResultOrigin()}</div>
                </div>
            </div>
            {children}
            {canViewConversation && conversationResult.conversation.tags?.length > 0 ? (
                <TagsWrapper>
                    {filterTags(conversationResult.conversation.tags).map((tag) => (
                        <Tag
                            style={{ background: tag.color }}
                            title={tag.name}
                            key={`${tag.name}${conversationResult.id}`}
                        />
                    ))}
                </TagsWrapper>
            ) : null}
        </Card>
    );
};

export default i18n(DefaultCard) as FC<DefaultCardProps>;
