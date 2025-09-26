import { FC, useEffect, useRef, useState } from 'react';
import { Icon } from '../../../../ui-kissbot-v2/common';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { FilterButtonProps } from './props';
import {
    ActivityType,
    ConversationTabFilter,
    KissbotSocket,
    KissbotSocketType,
    OrganizationSettings,
} from 'kissbot-core';
import TinyQueue from 'tinyqueue';
import mingo from 'mingo';
import CountInfo from '../CountInfo';
import { sleep } from '../../../../utils/Timer';
import { useSelector } from 'react-redux';
import { Notifyer } from '../../../../utils/Notifyer';
import styled from 'styled-components';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';

export const Button = styled.button`
    @media screen and (max-width: 1400px) {
        width: 44px;
    }
`;

const FilterButton: FC<FilterButtonProps & I18nProps> = ({
    onClick,
    title,
    type,
    icon,
    tabSelected,
    tabQuery,
    workspaceId,
    showCount = true,
    socketConnection,
    appliedFilters,
    teams,
    getTranslation,
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    let queueLock = false;

    const queueEvents: TinyQueue<KissbotSocket> = new TinyQueue([], (a: any, b: any) => {
        return a.timestamp - b.timestamp;
    });

    const selected = tabSelected === type;
    const [conversationsIds, setConversationsIds] = useState<string[]>([]);

    const conversationIdsRef: any = useRef(null);
    conversationIdsRef.current = { conversationsIds, setConversationsIds };

    const typeRef: any = useRef(null);
    typeRef.current = { type };

    const [currentAppliedFilters, setCurrentAppliedFilters] = useState<any>(undefined);
    const [currentFilterQuery, setCurrentFilterQuery] = useState<any>(undefined);

    const currentFilterQueryRef: any = useRef(null);
    currentFilterQueryRef.current = { currentFilterQuery, setCurrentFilterQuery };

    const settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } } = useSelector(
        (state: any) => state.loginReducer.settings
    );

    useEffect(() => {
        if (type === ConversationTabFilter.inbox) {
            const { conversationsIds } = conversationIdsRef.current;
            const length = conversationsIds.length || 0;

            if (!settings?.layout?.title) return;

            document.title = `${length > 0 ? `(${length > 100 ? '99+' : length})` : ''} ${
                settings.layout.title
            } - ${getTranslation('Conversations')}`;
        }
    }, [conversationsIds, type]);

    useEffect(() => {
        !!currentAppliedFilters && showCount && getTabCount();
    }, [currentAppliedFilters]);

    useEffect(() => {
        if (
            !appliedFilters ||
            JSON.stringify(appliedFilters) === JSON.stringify(currentAppliedFilters) ||
            Object.is(appliedFilters, currentAppliedFilters)
        ) {
            return;
        }

        setCurrentAppliedFilters({ ...appliedFilters });
    }, [appliedFilters]);

    useEffect(() => {
        if (socketConnection && tabQuery) {
            handleEvents();
        }
    }, [socketConnection, tabQuery]);

    const validateConversation = (conversation: any) => {
        const { conversationsIds, setConversationsIds } = conversationIdsRef.current;

        const validatedTab = validateTab(conversation);
        const conversationExistOnList = !!conversationsIds.find((id: string) => id === conversation._id);

        if (validatedTab) {
            if (conversationExistOnList) {
                return;
            }

            try {
                if (type === ConversationTabFilter.awaitAgent && !document.hasFocus()) {
                    const canShowNotificationConversationTeam = teams?.find(
                        (team) => team._id === conversation?.assignedToTeamId
                    )?.notificationNewAttendance;

                    if (
                        loggedUser?.liveAgentParams?.notifications?.notificationNewAttendance &&
                        canShowNotificationConversationTeam
                    ) {
                        Notifyer.notify({
                            title: 'Novo atendimento',
                            body: `Você possui um novo atendimento \n${
                                conversationsIds.length > 1
                                    ? `(${conversationsIds.length + 1}) atendimentos em espera.`
                                    : ''
                            }`,
                        });
                    }
                }
            } catch (e) {
                console.log(e);
            }

            return setConversationsIds((prevState) => [...prevState, conversation._id]);
        }

        if (conversationExistOnList) {
            return setConversationsIds((prevState) => [...prevState.filter((id) => id !== conversation._id)]);
        }
    };

    const validateActivity = (message: any) => {
        const { conversation, activity } = message;

        if (activity?.type === ActivityType.automatic_distribution) {
            !!conversation && validateConversation(conversation);
            getTabCount();
            return;
        }

        !!conversation && validateConversation(conversation);
    };

    const validateTab = (conversation: any) => {
        const { currentFilterQuery } = currentFilterQueryRef.current;

        let newQuery = {
            $and: [{ ...tabQuery }],
        };

        if (!!currentFilterQuery) {
            newQuery.$and = [currentFilterQuery, ...newQuery.$and];
        }

        const query = new mingo.Query(newQuery);
        return query.test(conversation);
    };

    const events = {
        [KissbotSocketType.CONVERSATION]: validateConversation,
        [KissbotSocketType.CONVERSATION_UPDATED]: validateConversation,
        [KissbotSocketType.ACTIVITY]: validateActivity,
    };

    const processEvent = async () => {
        try {
            while (queueEvents.length) {
                const event = queueEvents.pop();
                if (!event) {
                    return;
                }

                const action = events?.[event.type];

                if (action) {
                    await action(event.message);
                    if (settings.generalFeatureFlag?.enableTimeoutQueue) {
                        await sleep(10);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            queueLock = false;
        }
    };

    const receiveEvent = (event: KissbotSocket) => {
        if (events[event.type]) {
            queueEvents.push(event);
            if (!queueLock) {
                queueLock = true;
                processEvent();
            }
        }
    };

    const handleEvents = () => {
        if (socketConnection) {
            socketConnection.on('events', (event: KissbotSocket) => {
                receiveEvent(event);
            });
        }
    };

    const getTabCount = async () => {
        const response = await LiveAgentService.getTabCount(type, workspaceId, currentAppliedFilters);
        setConversationsIds(response?.conversations || []);
        setCurrentFilterQuery(response?.filtersQuery);
    };

    const count = conversationsIds.length;

    return (
        <Button
            title={title}
            style={{
                position: 'relative',
            }}
            type='button'
            className={`btn btn-light ${selected ? 'active' : ''}`}
            aria-pressed='false'
            onClick={() => onClick()}
        >
            {showCount && count > 0 && <CountInfo count={count} />}
            <Icon name={icon} margin='-3px 0 0 0' color={selected ? '#FFF' : '#333'} />
        </Button>
    );
};

export default I18n(FilterButton) as FC<FilterButtonProps>;
