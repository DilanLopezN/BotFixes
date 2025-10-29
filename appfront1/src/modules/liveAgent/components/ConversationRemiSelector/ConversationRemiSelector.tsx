import { FieldTimeOutlined } from '@ant-design/icons';
import { Dropdown, message, Radio, Row, Tag, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguageContext } from '../../../i18n/context';
import { useRemiOptimistic } from '../../context/RemiOptimisticContext';
import { useApplyReengagement } from '../../hooks/use-apply-reengagement';
import { useDeactivateReengagement } from '../../hooks/use-deactivate-reengagement';
import { useFetchSmartReengagementSetting } from '../../hooks/use-fetch-smart-reengagement-setting';
import { useFetchUniqueConversation } from '../../hooks/use-unique-conversation';
import { Conversation, Identity } from '../../interfaces/conversation.interface';
import { EllipsisSpan } from './styles';

interface ConversationRemiSelectorProps {
    conversation: Conversation;
    workspaceId: string | undefined;
    onUpdate: Function;
}
export const ConversationRemiSelector = ({ conversation, workspaceId, onUpdate }: ConversationRemiSelectorProps) => {
    const { getOptimisticState, setOptimisticStatus, allRemiRules } = useRemiOptimistic();
    const { smtReId, stoppedSmtReId } = getOptimisticState(conversation._id, conversation);
    const { getTranslation } = useLanguageContext();
    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);
    const { applyReengagement } = useApplyReengagement();
    const { deactivateReengagement } = useDeactivateReengagement();
    const { data: smartReengagementSetting } = useFetchSmartReengagementSetting(
        workspaceId,
        conversation?.smtReId || conversation?.stoppedSmtReId
    );
    const { fetchData: refetchConversation, conversation: conversationUpdate } = useFetchUniqueConversation(onUpdate);
    const currentConversation = conversationUpdate || conversation;
    const isUserMemberActive = conversation.members.some(
        (member: Identity) => member.id === loggedUser?._id && !member.disabled
    );

    const [localSmtReId, setLocalSmtReId] = useState(smtReId);
    const [localStoppedSmtReId, setLocalStoppedSmtReId] = useState(stoppedSmtReId);
    const remiState = useMemo(() => {
        if (!smtReId && !stoppedSmtReId) return 'disabled';
        if (!!smtReId || !!stoppedSmtReId) return 'active';
        return 'undefined';
    }, [smtReId, stoppedSmtReId]);

    const getIconColor = () => {
        const smtActive = Boolean(localSmtReId);
        const smtStopped = Boolean(localStoppedSmtReId);

        if ((smtActive && !smtStopped) || (smtActive && smtStopped)) {
            return '#2e8bff';
        }

        if (!smtActive && smtStopped) {
            return '#ff4d4f';
        }

        return undefined;
    };

    const activeRemiRuleId = useMemo(() => {
        return smartReengagementSetting?.smtReSettingId || null;
    }, [smartReengagementSetting?.smtReSettingId]);

    const remiItems = useMemo(() => {
        if (!allRemiRules || !currentConversation?.assignedToTeamId) return [];

        return allRemiRules
            .filter((rule): rule is typeof rule & { id: string } => {
                const teamIds = rule.teamIds || [];
                return teamIds.length === 0 || teamIds.includes(currentConversation.assignedToTeamId);
            })
            .sort((a, b) => {
                if (a.active !== b.active) {
                    return b.active ? 1 : -1;
                }
                return (a.name || '').localeCompare(b.name || '');
            })
            .map((rule) => ({
                key: rule.id,
                label: (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <Row align={'middle'} justify={'space-between'}>
                            <Radio checked={activeRemiRuleId === rule.id} style={{ marginRight: 8 }} />
                            <Tooltip title={rule.name}>
                                <EllipsisSpan>{rule.name}</EllipsisSpan>
                            </Tooltip>
                        </Row>
                        {!rule.active && <Tag color='red'>inativo</Tag>}
                    </span>
                ),
                disabled: !rule.active,
                type: 'item' as const,
            }));
    }, [allRemiRules, currentConversation.assignedToTeamId, activeRemiRuleId]);

    const handleMenuClick = useCallback(
        async ({ key }: { key: string }) => {
            if (conversation.state === 'closed') {
                message.warning(getTranslation('O reengajamento só pode ser ativado em atendimentos abertos.'));
                return;
            }
            if (!isUserMemberActive) {
                message.warning(getTranslation('Apenas membros ativos podem modificar o reengajamento.'));
                return;
            }

            if (!conversation?._id || !workspaceId) return;

            if (key === 'deactivate') {
                setOptimisticStatus(conversation._id, { smtReId: null, stoppedSmtReId: null });
                setLocalSmtReId(null);
                setLocalStoppedSmtReId(null);
                await deactivateReengagement(conversation._id, conversation.smtReId);
            } else {
                await applyReengagement(conversation._id, key);
                const updatedConversationData = await refetchConversation(workspaceId, conversation._id);

                if (updatedConversationData) {
                    setOptimisticStatus(conversation._id, { smtReId: updatedConversationData?.smtReId });
                }
            }
        },
        [
            conversation.state,
            conversation._id,
            conversation.smtReId,
            isUserMemberActive,
            workspaceId,
            getTranslation,
            deactivateReengagement,
            applyReengagement,
            refetchConversation,
            setOptimisticStatus,
        ]
    );

    const menuProps = useMemo(() => {
        return {
            onClick: handleMenuClick,
            items: [
                {
                    key: 'deactivate',
                    label: (
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <Radio checked={remiState === 'disabled'} style={{ marginRight: 8 }} />
                            {getTranslation('Desativar Reengajamento')}
                        </span>
                    ),
                    disabled: remiState !== 'active',
                    danger: remiState === 'active',
                    type: 'item' as const,
                },
                { type: 'divider' as const },
                ...remiItems,
            ],
        };
    }, [handleMenuClick, remiState, getTranslation, remiItems]);

    useEffect(() => {
        setLocalSmtReId(smtReId);
        setLocalStoppedSmtReId(stoppedSmtReId);
    }, [smtReId, stoppedSmtReId]);
    return (
        <Dropdown menu={menuProps} trigger={['hover']} placement='bottomRight'>
            <FieldTimeOutlined
                style={{
                    color: getIconColor(),
                    fontSize: 24,
                    marginTop: 4,
                }}
            />
        </Dropdown>
    );
};
