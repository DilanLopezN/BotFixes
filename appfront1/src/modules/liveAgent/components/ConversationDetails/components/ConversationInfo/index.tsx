import { ConversationStatus, IdentityType } from 'kissbot-core';
import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import I18n from '../../../../../i18n/components/i18n';
import { Conversation } from '../../../../interfaces/conversation.interface';
import ModalRigthSide from '../../../RigthSideConversationInfoModal';
import AssignedTeam from '../AssignedTeam';
import AttributeList from '../AttributeList';
import { ConversationCategorization } from '../ConversationCategorization';
import CreatedByChannel from '../CreatedByChannel';
import FileList from '../FileList';
import MemberList from '../MemberList';
import { ModalFileList } from '../ModalFileList';
import TagList from '../TagList';
import { ConversationInfoProps } from './props';
import './style.scss';

enum ModalTypes {
    files = 'files',
}

interface ModalOption {
    title: string;
    component: any;
}

const ConversationInfo: FC<ConversationInfoProps> = ({
    conversation,
    workspaceId,
    onTagsChanged,
    openImage,
    readingMode,
    channelList,
    conversationDisabled,
    teams,
    loggedUser,
}) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const options: { [key in ModalTypes]: ModalOption } = {
        [ModalTypes.files]: {
            title: 'Files',
            component: ModalFileList,
        },
    };

    const [optionSelected, setOptionSelected] = useState<ModalOption | undefined>(undefined);

    const shouldShowConversationCategorization = (conversation: Conversation) => {
        if (!conversation || !conversation.closedBy || !conversation.members) {
            return true;
        }

        const closedById = conversation.closedBy;
        return !conversation.members.some(
            (member) =>
                member.id === closedById && (member.type === IdentityType.system || member.type === IdentityType.bot)
        );
    };

    const closeModalFiles = () => {
        setOptionSelected(undefined);
    };

    const onOptionSelected = (type: ModalTypes) => {
        setOptionSelected(options[type]);
    };

    const Component = optionSelected?.component;

    return conversation?._id ? (
        <Wrapper
            width='100%'
            height='100%'
            bgcolor='#ffffff'
            flexBox
            overflowY='auto'
            overflowX='hidden'
            className='ConversationInfo'
            column
        >
            {selectedWorkspace?.userFeatureFlag?.enableConversationCategorization &&
                conversation.state === ConversationStatus.closed &&
                conversation.assignedToTeamId &&
                shouldShowConversationCategorization(conversation) && (
                    <ConversationCategorization workspaceId={workspaceId} conversation={conversation} />
                )}
            {!conversationDisabled && (
                <TagList
                    readingMode={readingMode}
                    conversation={conversation}
                    workspaceId={workspaceId}
                    onTagsChanged={onTagsChanged}
                    loggedUser={loggedUser}
                />
            )}
            <CreatedByChannel conversation={conversation} channelList={channelList} />
            {!conversationDisabled && (
                <>
                    <AssignedTeam teamId={conversation.assignedToTeamId} teams={teams} />
                    <MemberList
                        conversationState={conversation.state}
                        members={conversation.members}
                        workspaceId={workspaceId}
                        conversationId={conversation._id}
                    />
                    <FileList openImage={openImage} conversation={conversation} openModal={onOptionSelected} />
                    <AttributeList conversationId={conversation._id} attributes={conversation.attributes} />
                </>
            )}
            {optionSelected && (
                <ModalRigthSide closeModal={closeModalFiles} title={optionSelected.title}>
                    <Component openImage={openImage} conversation={conversation} />
                </ModalRigthSide>
            )}
        </Wrapper>
    ) : null;
};

export default I18n(ConversationInfo);
