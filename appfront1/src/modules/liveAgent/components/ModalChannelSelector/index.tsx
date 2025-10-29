import { FC, useState, useEffect } from 'react';
import { Wrapper, PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { ModalChannelSelectorProps } from './props';
import { ModalPortal } from '../../../../shared/ModalPortal/ModalPortal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { ChannelConfig } from '../../../../model/Bot';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import './style.scss';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import ChannelItem from './ChannelItem';
import { ChannelIdConfig } from 'kissbot-core';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { Team } from '../../../../model/Team';
import { useSelector } from 'react-redux';
import { SettingsService } from '../../../settings/service/SettingsService';
import { Scroll, EmptyDataInfo } from './styled';
import { TeamItemSelect } from '../TeamSelectorTemplate';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import { Divider, Skeleton, Tooltip } from 'antd';
import styled from 'styled-components';
import { LiveAgentService } from '../../service/LiveAgent.service';

const Icon = styled.span<{disabled?: boolean }>`
    margin-right: 8px;
:before {
    font-size: 16px;
    ${(props) => (props.disabled ? `color: red;` : `color: green;`)}
    }
`;

const ModalChannelSelector: FC<ModalChannelSelectorProps & I18nProps> = ({
    isOpened,
    workspaceId,
    onClose,
    getTranslation,
    onConversationDataChange,
    invalidChannelConfigTokensToOpenConversation,
    contactPhone,
    ddi,
    contactId,
}) => {
    const [opened, setOpened] = useState(isOpened || false);
    const [channels, setChannels] = useState<ChannelConfig[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [channelSelected, setChannelSelected] = useState<ChannelConfig | undefined>(undefined);
    const [teamSelected, setTeamSelected] = useState<Team | undefined>(undefined);
    const [invalidChannels, setInvalidChannels] = useState<string[]>(invalidChannelConfigTokensToOpenConversation || []);

    const [fetchingChannels, setFetchingChannels] = useState(true);
    const [fetchingTeams, setFetchingTeams] = useState(true);

    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    useEffect(() => {
        setOpened(isOpened);
    }, [isOpened]);

    useEffect(() => {
        if (!opened) return;
        if (!invalidChannelConfigTokensToOpenConversation) {
            checkInvalidChannelsToOpenConversation();
        }
        getChannels();
        getTeams();
    }, [opened]);

    const checkInvalidChannelsToOpenConversation = async () => {
        if (!contactPhone) {
            return;
        }
        const response = await LiveAgentService.checkPhoneStatus(contactPhone, ddi, workspaceId, contactId, () => {});

        if (response?.conversationByChannel?.length) {
            let newInvalidChannels: string[] = [];
            response?.conversationByChannel?.filter(curr => !!curr?.conversation).forEach((conv) => {
                newInvalidChannels.push(conv.channelConfigToken);
            });
            setInvalidChannels(newInvalidChannels)
        }
    }

    const getChannels = async () => {
        try {
            const channels = await ChannelConfigService.getChannelsConfig({
                workspaceId,
                channelId: {
                    $in: [ChannelIdConfig.gupshup],
                },
                enable: true,
            });

            const validChannels = channels.filter((ch) => ch.canStartConversation) ?? [];
            setChannels(validChannels);

            if (validChannels.length === 1) {
                setChannelSelected(validChannels[0]);
            }
        } catch (error) {}

        setFetchingChannels(false);
    };

    const getTeams = async () => {
        try {
            const canListAllTeams = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);
            let query: any = {};

            if (canListAllTeams) {
                query = {
                    filter: {},
                };
            } else {
                query = {
                    filter: {
                        roleUsers: {
                            $elemMatch: {
                                userId: loggedUser._id,
                                $or: [{ 'permission.canStartConversation': true }, { isSupervisor: true }],
                            },
                        },
                    },
                };
            }

            // projection esta limitando os campos que seram retornados da api
            query.projection = {
                _id: 1,
                name: 1,
                roleUsers: 1,
                color: 1,
                inactivatedAt: 1,
            };

            const response = await SettingsService.getTeams(query, workspaceId);
            const activeTeams = response?.data?.filter((team) => !team.inactivatedAt) ?? [];
            setTeams(activeTeams);
        } catch (error) {}

        setFetchingTeams(false);
    };

    const onSubmit = () => {
        onConversationDataChange({ channelConfig: channelSelected as ChannelConfig, team: teamSelected as Team });
        onClose();
    };

    const onKeyDown = () => {
        document.onkeydown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
    };

    if (!isOpened) {
        return null;
    }

    const getChannelsRender = () => {
        if (fetchingChannels) {
            return <Skeleton avatar paragraph={{ width: '100%', rows: 1 }} active />;
        }

        if (channels.length) {
            return (
                <Scroll margin='0 0 20px 0' overflowY={'auto'}>
                    {channels.map((channel: ChannelConfig) => {
                        const disabled = invalidChannels?.includes(channel.token);
                        return (
                                <ChannelItem
                                    onClick={() => !disabled && setChannelSelected(channel)}
                                    channel={channel}
                                    selected={channelSelected ? channelSelected._id === channel._id : false}
                                    disabled={disabled}
                                />
                        );
                    })}
                </Scroll>
            );
        }

        return (
            <EmptyDataInfo>
                <p>{getTranslation('There is no channel available to start attendances')}</p>
            </EmptyDataInfo>
        );
    };

    const getTeamsRender = () => {
        if (fetchingTeams) {
            return <Skeleton paragraph={{ width: '100%', rows: 2 }} active />;
        }

        if (teams.length) {
            return (
                <Scroll margin='0 0 35px 0' height='250px' overflowY={'auto'}>
                    {teams.map((team: Team) => {
                        return (
                            <TeamItemSelect
                                setTeamSelected={(team: Team) => setTeamSelected(team)}
                                team={team}
                                teamSelected={teamSelected}
                            />
                        );
                    })}
                </Scroll>
            );
        }

        return (
            <EmptyDataInfo>
                <p>
                    {getTranslation(
                        'It seems that there is no team or you are not allowed to start new attendances. Talk to your supervisor!'
                    )}
                </p>
            </EmptyDataInfo>
        );
    };

    return (
        <ModalPortal
            height='auto'
            className='ModalChannelSelector'
            width='480px'
            minWidth='400px'
            isOpened={opened}
            position={ModalPosition.center}
            onClickOutside={() => {
                onKeyDown();
                setOpened(false);
                onClose();
            }}
        >
            <Wrapper padding='16px'>
                <Wrapper fontSize='16px' fontWeight='600' margin='0 0 10px 0'>
                    {getTranslation('Select a channel')}
                </Wrapper>
                {getChannelsRender()}
                <Wrapper fontSize='16px' fontWeight='600' margin='0 0 10px 0'>
                    {getTranslation('Select a team')}
                </Wrapper>
                {getTeamsRender()}
                <Wrapper flexBox justifyContent='space-between'>
                    <PrimaryButton
                        minWidth='80px'
                        onClick={() => {
                            setChannelSelected(undefined);
                            setOpened(false);
                        }}
                        colorType={ColorType.text}
                    >
                        {getTranslation('Cancel')}
                    </PrimaryButton>
                    <PrimaryButton
                        minWidth='80px'
                        disabled={!channelSelected || !teamSelected}
                        onClick={() => {
                            onSubmit();
                            onClose();
                        }}
                    >
                        {getTranslation('Start attendance')}
                    </PrimaryButton>
                </Wrapper>
            </Wrapper>
        </ModalPortal>
    );
};

export default i18n(ModalChannelSelector) as FC<ModalChannelSelectorProps>;
