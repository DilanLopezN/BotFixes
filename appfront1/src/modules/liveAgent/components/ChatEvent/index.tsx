import { ActivityType } from 'kissbot-core';
import moment from 'moment';
import { FC, useMemo } from 'react';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useRemiOptimistic } from '../../context/RemiOptimisticContext';
import { ChatEventProps } from './props';
import { Balloon, Timestamp } from './styled';

const EventMessageRenderer: FC<{ message: string; timestamp: number }> = ({ message, timestamp }) => (
    <Wrapper margin='2px 0 0 0' color={'#696969'} fontSize='11px'>
        <span>{message}</span>
        <Timestamp>{` ${moment(timestamp).fromNow()}`}</Timestamp>
    </Wrapper>
);

const ChatEvent = ({
    activity: { type, timestamp, from, data, hash, workspaceId },
    teams,
    getTranslation,
}: ChatEventProps & I18nProps) => {
    const { allRemiRules } = useRemiOptimistic();

    const remiName = useMemo(() => {
        if (data?.smtReSettingId && allRemiRules) {
            const remiRule = allRemiRules.find((rule) => rule.id === data.smtReSettingId);
            return remiRule?.name || '';
        }
        return '';
    }, [data?.smtReSettingId, allRemiRules]);

    const teamName = useMemo(() => {
        if (type === ActivityType.assigned_to_team && data?.teamId) {
            const team = teams.find((t) => t._id === data.teamId);
            return team?.name || '';
        }
        return '';
    }, [type, data?.teamId, teams]);

    const eventMessage = useMemo(() => {
        const fromName = from?.name || '';
        const botName = from?.type === 'bot' ? 'Bot' : fromName;

        switch (type) {
            case ActivityType.assigned_to_team:
                return `${botName} ${getTranslation('assigned conversation to team')} ${teamName}`;
            case ActivityType.member_added:
            case ActivityType.member_connected:
                return `${fromName} ${getTranslation('joined the conversation')}`;
            case ActivityType.member_reconnected:
                return `${fromName} ${getTranslation('returned to the conversation')}`;
            case ActivityType.member_removed:
            case ActivityType.member_exit:
            case ActivityType.bot_disconnected:
            case ActivityType.member_disconnected:
                return `${fromName} ${getTranslation('left the conversation')}`;
            case ActivityType.bot_took_on:
                return `Bot ${fromName} ${getTranslation('assumed the conversation')}`;
            case ActivityType.suspend_conversation:
                return `${fromName} ${getTranslation('suspended conversation until')} ${moment(data?.until).format(
                    'DD/MM/YYYY HH:mm'
                )} -`;
            case ActivityType.end_conversation:
                return `${fromName} ${getTranslation('ended the conversation')}`;
            case ActivityType.member_removed_by_admin:
                return `${fromName} ${getTranslation('removed')} ${data?.name || ''} ${getTranslation(
                    'of conversation'
                )}`;
            case ActivityType.member_add_by_admin:
                return `${fromName} ${getTranslation('transferred the conversation to')} ${data?.name || ''}`;
            case ActivityType.automatic_distribution:
                return `${getTranslation('Conversation automatically assigned to the user')} ${data?.memberName || ''}`;
            case ActivityType.smt_re_activated:
                return `Remi ${remiName} ${getTranslation('was activated')}`;
            case ActivityType.smt_re_stopped:
                return `Remi ${remiName} ${getTranslation('returned the conversation')}`;
            case ActivityType.smt_re_monitoring:
                return `Remi ${remiName} ${getTranslation('is monitoring the conversation')}`;
            case ActivityType.smt_re_deactivated:
                return `Remi ${remiName} ${getTranslation('was deactivated')}`;
            case ActivityType.smt_re_assumed:
                return `Remi ${remiName} ${getTranslation('assumed the conversation')}`;
            default:
                return null;
        }
    }, [type, from, data, getTranslation, teamName, remiName]);

    return (
        <Wrapper key={hash} margin='0 0 7px 0' flexBox position='relative'>
            <Wrapper margin='0 auto'>
                <Balloon title={moment(timestamp).format('DD/MM/YYYY HH:mm')}>
                    {eventMessage && <EventMessageRenderer message={eventMessage} timestamp={timestamp} />}
                </Balloon>
                {false && !!timestamp && (
                    <Wrapper flexBox width='100%' textAlign='center'>
                        <Wrapper color='#808080' fontSize='14px' flexBox>
                            {moment(timestamp).fromNow()}
                            <Icon name='comment-outline' size='12px' margin='0 0 0 4px' color='#808080' />
                        </Wrapper>
                    </Wrapper>
                )}
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(ChatEvent) as FC<ChatEventProps>;
