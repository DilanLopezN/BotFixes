import { Button } from 'antd';
import { User } from 'kissbot-core';
import { FC, useState } from 'react';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ClosingMessageModal } from '../ClosingMessageModal';
import { ConversationCardData } from '../ConversationCard/props';

interface CloseButtonProps {
    workspaceId: string;
    loggedUser: User;
    conversation: ConversationCardData;
    addNotification: Function;
    onCloseConversation: Function;
    onUpdatedConversationSelected?: Function;
    channels: ChannelConfig[];
    teams: Team[];
}

const CloseButtonComponent = ({
    getTranslation,
    channels,
    workspaceId,
    loggedUser,
    conversation,
    addNotification,
    onCloseConversation,
    onUpdatedConversationSelected,
    teams,
}: CloseButtonProps & I18nProps) => {
    const [modalConfirmationOpened, setModalConfirmationOpened] = useState<boolean>(false);

    return (
        <div>
            <Button className='antd-span-default-color' ghost danger onClick={() => setModalConfirmationOpened(true)}>
                {getTranslation('Close')}
            </Button>
            {modalConfirmationOpened && (
                <ClosingMessageModal
                    opened={modalConfirmationOpened}
                    conversation={conversation}
                    channels={channels}
                    setOpened={setModalConfirmationOpened}
                    workspaceId={workspaceId}
                    loggedUser={loggedUser}
                    closeConversation={(value) => {
                        setModalConfirmationOpened(false);
                        onCloseConversation(value);
                    }}
                    addNotification={addNotification}
                    onUpdatedConversationSelected={onUpdatedConversationSelected}
                    teams={teams}
                />
            )}
        </div>
    );
};

export const CloseButton = i18n(CloseButtonComponent) as FC<CloseButtonProps>;
