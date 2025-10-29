import React, { FC, useState, ReactElement } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import { ChannelSelectorProps } from './props'
import ModalChannelSelector from '../ModalChannelSelector'

const ChannelSelector: FC<ChannelSelectorProps> = ({
    children,
    workspaceId,
    selectAndCreateConversation,
    onConversationCreated,
    onChannelSelected,
    invalidChannelConfigTokensToOpenConversation,
    contactPhone,
    ddi,
    contactId,
}) => {
    const [opened, setOpened] = useState<boolean>(false)

    const clonedChildren = children && React.cloneElement(children as ReactElement<any>, { onClick: () => handleClick() });

    const handleClick = () => {
        setOpened(true);
    }

    const handleClose = () => {
        setOpened(false)
    }

    return (
        <div>
            <ModalChannelSelector
                isOpened={opened}
                onConversationDataChange={onChannelSelected}
                invalidChannelConfigTokensToOpenConversation={invalidChannelConfigTokensToOpenConversation}
                workspaceId={workspaceId}
                selectAndCreateConversation={selectAndCreateConversation}
                onClose={() => handleClose()}
                onConversationCreated={onConversationCreated}
                contactPhone={contactPhone}
                ddi={ddi}
                contactId={contactId}
            />
            <Wrapper>
                {clonedChildren}
            </Wrapper>
        </div>
    )
}

export default ChannelSelector;
