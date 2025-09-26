import { Popconfirm, Tooltip, notification } from 'antd';
import { ConversationStatus, IdentityType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { UserAvatar, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Identity } from '../../../../interfaces/conversation.interface';
import CardWrapper from '../CardWrapper';
import { Label } from '../Common/common';
import { PopoverMember } from './member-list-view';
import { MemberListProps } from './props';
import { DynamicAvatar, Exceeded, RemoveAgentIcon, StatusIcon } from './styles';
import { useRemoveMember } from './use-remove-member';

const MemberList: FC<MemberListProps & I18nProps> = ({
    getTranslation,
    members,
    conversationState,
    conversationId,
    workspaceId,
}) => {
    const [membersBkp, setMembers] = useState(members);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const { adminRemoveMember, error, loading } = useRemoveMember({ workspaceId, conversationId });
    const MAX_USERS_RENDER = 5;
    const isPermissionToRemove: boolean = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);

    const membersToRender = () => {
        return membersBkp.filter((member) =>
            [IdentityType.user, IdentityType.agent, IdentityType.bot].includes(member.type)
        );
    };
    const membersFiltered = membersToRender();

    const diffUsersLength = membersFiltered.length - MAX_USERS_RENDER;

    const memberStatus = (member: Identity) => {
        if (member.disabled) {
            return { status: 'disconnected' };
        }

        return { status: 'online' };
    };

    const canRemoveMember = (member: Identity) => {
        return (
            isPermissionToRemove &&
            !!membersFiltered.find((member) => !member.disabled && member.id === loggedUser?._id) &&
            member.id !== loggedUser?._id &&
            !member.disabled &&
            member.type === IdentityType.agent &&
            conversationState !== ConversationStatus.closed
        );
    };

    useEffect(() => {
        setMembers([...members]);
    }, [members]);

    useEffect(() => {
        if (error) {
            notification.warning({
                message: getTranslation('Error'),
                description: getTranslation('Error on delete agent'),
                duration: 3,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    return (
        <CardWrapper>
            <Label title={`${getTranslation('Participants')}`}>{`${getTranslation('Participants')}:`}</Label>
            <PopoverMember
                {...{
                    conversationState,
                    memberStatus,
                    membersFiltered,
                    adminRemoveMember,
                    getTranslation,
                    isPermissionToRemove,
                    loading,
                }}
            >
                <Wrapper margin='5px 5px 0 5px' flexBox>
                    {membersFiltered.slice(0, MAX_USERS_RENDER).map((member: Identity, index) => {
                        const status = memberStatus(member);
                        return (
                            <DynamicAvatar index={index} key={member.id}>
                                {canRemoveMember(member) && (
                                    <Popconfirm
                                        title={getTranslation('Remove agent from conversation?')}
                                        onConfirm={(e) => {
                                            e?.stopPropagation();
                                            adminRemoveMember(member.id);
                                        }}
                                        cancelText={getTranslation('No')}
                                        okText={<span style={{ color: '#fff' }}>{getTranslation('Yes')}</span>}
                                        placement={'topRight'}
                                        okButtonProps={{ loading }}
                                    >
                                        <RemoveAgentIcon
                                            title={`${getTranslation('Remove')} ${
                                                member?.name || getTranslation('agent')
                                            } ${getTranslation('this conversation')}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        />
                                    </Popconfirm>
                                )}
                                <UserAvatar
                                    hashColor={member.id}
                                    user={member}
                                    size={33}
                                    style={{ cursor: 'pointer' }}
                                />
                                {conversationState !== ConversationStatus.closed && (
                                    <StatusIcon
                                        title={
                                            status.status === 'online'
                                                ? getTranslation('Active')
                                                : getTranslation('Left the conversation')
                                        }
                                        status={status.status}
                                    />
                                )}
                            </DynamicAvatar>
                        );
                    })}
                    {diffUsersLength > 0 && (
                        <Tooltip
                            style={{ flexWrap: 'nowrap' }}
                            placement='top'
                            title={membersFiltered.slice(MAX_USERS_RENDER, 999).map((agent: Identity) => {
                                return (
                                    <div
                                        key={agent.id}
                                        style={{
                                            display: 'flex',
                                            color: '#fff',
                                            flexWrap: 'nowrap',
                                        }}
                                    >
                                        {agent.name}
                                    </div>
                                );
                            })}
                        >
                            <DynamicAvatar index={MAX_USERS_RENDER + 1}>
                                <Exceeded children={`+${diffUsersLength}`} />
                            </DynamicAvatar>
                        </Tooltip>
                    )}
                </Wrapper>
            </PopoverMember>
        </CardWrapper>
    );
};

export default i18n(MemberList);
