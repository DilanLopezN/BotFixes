import React, { FC } from 'react'
import { AvatarIconAgroupedProps } from './props';
import { UserAvatar } from '../../../../ui-kissbot-v2/common';
import styled from 'styled-components';
import { Identity } from '../../interfaces/conversation.interface';
import { Tooltip } from 'antd';

const Content = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
`;

const Exceeded = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #FFF;
    margin: -5px;
    border-radius: 50%;
    font-size: 10px;
    background-color: #919191;
    width: 22px;
    height: 22px;
    color: #FFF !important;
`;

const AvatarIconAgrouped: FC<AvatarIconAgroupedProps> = ({
    agents,
    disabled,
    maxAvatarVisible
}) => {

    const getAgents = (disabled: boolean) => {
        const agentsDisable = agents.filter((agent: Identity) => {
            return agent.disabled === true
        })
        const agentsEnabled = agents.filter((agent: Identity) => {
            return agent.disabled === false
        })
        if (disabled === true) {
            console.log('agentsDisable: ',agentsDisable, agents)
            return agentsDisable
        } else {
            return agentsEnabled
        }
    }
    return <Content>
        {getAgents(disabled).slice(0, maxAvatarVisible).map((agent: Identity, index) => {
            return <div
                key={agent.id}
                style={{
                    display: 'flex',
                    border: '2px solid #FFF',
                    margin: `0 0 0 ${index === 0 ? '0' : '-5px'}`,
                    borderRadius: '50%'
                }}
            >
                <UserAvatar
                    style={{
                        display: 'flex',
                    }}
                    user={agent}
                    hashColor={agent.id}
                    size={18}
                />
            </div>
        })}
        {
            getAgents(disabled).length > maxAvatarVisible &&

            <Tooltip style={{ flexWrap: 'nowrap' }} placement="top" title={getAgents(disabled).slice(maxAvatarVisible, 10).map((agent: Identity) => {
                return <div
                    key={agent.id}
                    style={{
                        display: 'flex',
                        color: '#fff',
                        flexWrap: 'nowrap'
                    }}
                >
                    {agent.name}
                </div>
            })}>
                <Exceeded>+{getAgents(disabled).length - maxAvatarVisible}</Exceeded>
            </Tooltip>

        }
    </Content>
}

export default AvatarIconAgrouped as FC<AvatarIconAgroupedProps>;