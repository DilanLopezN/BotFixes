import { FC } from 'react';
import styled from 'styled-components';
import { convertChannelName } from '../../../../../../utils/ConvertChannelName';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import CardWrapper from '../CardWrapper';
import { Label } from '../Common/common';
import { CreatedByChannelProps } from './props';

const Content = styled(CardWrapper)`
    display: flex;
    align-items: center;
`;

const CreatedByChannel: FC<CreatedByChannelProps & I18nProps> = ({ channelList, conversation, getTranslation }) => {
    const channelConfig = channelList.find((channel) => channel.token === conversation.token);
    const channelId = channelConfig ? conversation.createdByChannel : '';

    const channelName = channelConfig ? channelConfig.name || channelConfig._id : '';
    return (
        <Content>
            <Label title={`${channelName}/${getTranslation(`${convertChannelName(channelId)}`)}`}>
                {`${getTranslation('Channel')}: ${channelName}`}/{getTranslation(`${convertChannelName(channelId)}`)}
            </Label>
        </Content>
    );
};

export default i18n(CreatedByChannel) as FC<CreatedByChannelProps>;
