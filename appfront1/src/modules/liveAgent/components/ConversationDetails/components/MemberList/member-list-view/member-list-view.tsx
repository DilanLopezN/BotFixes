import { List, Popconfirm, Popover } from 'antd';
import { ConversationStatus, IdentityType } from 'kissbot-core';
import { FC } from 'react';
import { useSelector } from 'react-redux';
import { UserAvatar } from '../../../../../../../ui-kissbot-v2/common';
import I18nWrapper from '../../../../../../i18n/components/i18n';
import { Identity } from '../../../../../interfaces/conversation.interface';
import { MemberListViewProps } from './props';
import { RemoveAgentIcon } from './styles';

const PopoverListMember: FC<MemberListViewProps> = ({
    getTranslation,
    membersFiltered,
    conversationState,
    memberStatus,
    children,
    adminRemoveMember,
    isPermissionToRemove,
    loading,
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const statusPopover = (member: Identity) => {
        if (conversationState !== ConversationStatus.closed) {
            return memberStatus(member).status === 'online' ? 'Em atendimento' : 'saiu do atendimento';
        }

        if (conversationState === ConversationStatus.closed) {
            return 'Encerrado';
        }

        return null;
    };

    const getTypeLabel = (member: Identity) => {
        if (member.type === IdentityType.user) return getTranslation('Contact');
        if (member.type === IdentityType.agent) return getTranslation('Agent');
        if (member.type === IdentityType.bot) return getTranslation('Bot');
    };

    const canRemoveMember = (member: Identity) => {
        return (
            isPermissionToRemove &&
            !!membersFiltered.find((m) => !m.disabled && m.id === loggedUser?._id) &&
            member.id !== loggedUser?._id &&
            !member.disabled &&
            member.type === IdentityType.agent &&
            conversationState !== ConversationStatus.closed
        );
    };

    const content = (
        <List
            rowKey={(member) => member.id}
            itemLayout='horizontal'
            dataSource={membersFiltered}
            renderItem={(member) => (
                <List.Item style={{ display: 'flex', padding: '6px 0', position: 'relative' }}>
                    <List.Item.Meta
                        style={{ width: '200px' }}
                        avatar={
                            <div style={{ position: 'relative' }} key={member.id}>
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
                                <UserAvatar hashColor={member.id} user={member} size={33} />
                            </div>
                        }
                        title={
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.name}
                            </div>
                        }
                        description={statusPopover(member)}
                    />

                    <div style={{ minWidth: '40px' }}>{getTypeLabel(member)}</div>
                </List.Item>
            )}
        />
    );

    return (
        <Popover placement='left' trigger='click' content={content}>
            {children}
        </Popover>
    );
};

export const PopoverMember = I18nWrapper(PopoverListMember);
