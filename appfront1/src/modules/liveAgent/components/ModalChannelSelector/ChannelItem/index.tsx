import { FC } from 'react';
import { ChannelItemProps } from './props';
import i18n from '../../../../i18n/components/i18n';
import styled from 'styled-components';
import { ChannelIdConfig } from 'kissbot-core';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { Tag, Tooltip } from 'antd';

const Item = styled.div<{ selected: boolean; disabled?: boolean }>`
    display: flex;
    padding: 8px 10px;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    ${(props) => (props.selected ? `background: #f1f1f1;` : `background: #FFF;`)}
`;

const ItemName = styled.div`
    display: flex;
    margin-right: 5px;
    ${Item}:hover & {
        span {
            color: #333;
        }
    }

    margin-left: 8px;

    span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
`;

const Icon = styled.span<{ disabled?: boolean }>`
    :before {
        font-size: 16px;
        ${(props) => (props.disabled ? `color: orange;` : `color: green;`)}
    }
`;

const ChannelItem: FC<ChannelItemProps & I18nProps> = ({ channel, getTranslation, onClick, selected, disabled }) => {
    const iconType = (channelId: string) => {
        switch (channelId) {
            case ChannelIdConfig.gupshup:
                return {
                    icon: 'whatsapp',
                    title: `whatsApp ${getTranslation('Official')}`,
                };

            default:
                return {};
        }
    };

    const { icon, title } = iconType(channel.channelId);

    let text = '';
    if (disabled) {
        text = getTranslation('There is already an open service on the channel for this number');
    } else {
        text = getTranslation('Channel available to start answering the number');
    }
    return (
        <Item title={channel.name} selected={selected} onClick={onClick}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon disabled={disabled} className={`mdi mdi-${icon}`} />
                <ItemName>
                    <span style={{ width: 230 }}>
                        {title}
                        {' - '}
                        {channel.name}
                    </span>
                </ItemName>
            </div>
            <Tooltip placement='top' title={text}>
                <Tag color={disabled ? 'orange' : 'green'}>
                    {disabled ? getTranslation('Já tem atendimento aberto') : getTranslation('Available')}
                </Tag>
            </Tooltip>
        </Item>
    );
};

export default i18n(ChannelItem) as FC<ChannelItemProps>;
