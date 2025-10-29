import { FC, useEffect, useState } from 'react';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { getDataFromCreatedChannel } from '../../../created-by-channel';
import { CreatedChannel } from './styled';
import { UserAvatar } from '../../../../../../ui-kissbot-v2/common';
import { validateCanViewConversation } from '../../../../../../model/Team';
import { ConversationSearchCardProps } from './props';
import DefaultCard from './default-card';
import { IdentityType } from 'kissbot-core';

const ConversationSearchCard: FC<ConversationSearchCardProps & I18nProps> = ({
    conversationResult,
    onSelectConversation,
    getTranslation,
    selected,
    loggedUser,
    workspaceId,
    teams,
}) => {
    const [canViewConversation, setCanViewConversation] = useState<boolean>(false);
    const { conversation } = conversationResult;

    const channelCreated = getDataFromCreatedChannel(conversation.createdByChannel);

    const validateTeamPermissionViewActivities = () => {
        const canAcessConversation = validateCanViewConversation({
            conversation,
            loggedUser,
            workspaceId,
            teams,
        });

        setCanViewConversation(canAcessConversation);
    };

    useEffect(() => {
        validateTeamPermissionViewActivities();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationResult]);

    const formatAttributeValue = (attrValue: any) => {
        return attrValue;
    };

    if (conversationResult.dataType === 1) {
        return (
            <DefaultCard
                getTranslation={getTranslation}
                onSelectConversation={onSelectConversation}
                conversationResult={conversationResult}
                selected={selected}
                loggedUser={loggedUser}
                canViewConversation={canViewConversation}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span
                            title={conversationResult.attrLabel}
                            style={{
                                margin: '0 0 0 5px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                            }}
                        >{`${formatAttributeValue(conversationResult.attrValue)} - ${
                            conversationResult.attrLabel
                        }`}</span>
                    </div>
                    <div>
                        <CreatedChannel title={getTranslation(channelCreated.title)}>
                            <img src={`assets/img/${channelCreated.icon}.svg`} alt='' />
                        </CreatedChannel>
                    </div>
                </div>
            </DefaultCard>
        );
    }

    if (conversationResult.dataType === 2) {
        return (
            <DefaultCard
                getTranslation={getTranslation}
                onSelectConversation={onSelectConversation}
                conversationResult={conversationResult}
                selected={selected}
                loggedUser={loggedUser}
                canViewConversation={canViewConversation}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <UserAvatar size={26} user={{ name: conversationResult.contactName }} />
                        <span
                            title={conversationResult.contactName}
                            style={{
                                margin: '0 0 0 5px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                            }}
                        >
                            {`${conversationResult.contactPhone} - ${conversationResult.contactName}`}
                        </span>
                    </div>
                    <div>
                        <CreatedChannel>
                            <img src={`assets/img/${channelCreated.icon}.svg`} alt='' />
                        </CreatedChannel>
                    </div>
                </div>
            </DefaultCard>
        );
    }

    const user = conversationResult.conversation.members.find((member) => member.type === IdentityType.user);

    if (conversationResult.dataType === 3) {
        return (
            <DefaultCard
                getTranslation={getTranslation}
                onSelectConversation={onSelectConversation}
                conversationResult={conversationResult}
                selected={selected}
                loggedUser={loggedUser}
                canViewConversation={canViewConversation}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <UserAvatar size={26} user={{ name: conversationResult.contactName }} />
                        <span
                            title={user?.name}
                            style={{
                                margin: '0 0 0 5px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                            }}
                        >
                            {user?.name}
                        </span>
                    </div>
                    <div>
                        <CreatedChannel>
                            <img src={`assets/img/${channelCreated.icon}.svg`} alt='' />
                        </CreatedChannel>
                    </div>
                </div>
            </DefaultCard>
        );
    }

    return null;
};

export default i18n(ConversationSearchCard) as FC<ConversationSearchCardProps>;
