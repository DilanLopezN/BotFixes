import React, { useEffect, FC, useState } from 'react'
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { BotService } from '../../modules/bot/services/BotService';
import { ChannelConfig, Bot } from '../../model/Bot';
import { CustomSelect } from '../StyledForms/CustomSelect/CustomSelect';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import I18n from '../../modules/i18n/components/i18n';
import { Wrapper } from '../../ui-kissbot-v2/common';
import { Link } from 'react-router-dom';

export interface ChannelListProps extends I18nProps {
  currentValue: string;
  botId: string;
  workspaceId: string;
  onChange: (...params) => any;
  currentBot: Bot;
}

const ChannelList: FC<ChannelListProps> = (props) => {

  const {
    botId,
    currentValue,
    onChange,
    getTranslation,
    currentBot
  } = props;

  const [channelList, setChannelList] = useState<ChannelConfig[]>([]);

  useEffect(() => {
    getChannels()
  }, [])

  const getChannels = async () => {
    const channelList = await BotService.getChannelConfigList(botId)

    if (channelList)
      setChannelList(channelList)
  }

  const renderOptions = () => {
    return channelList.map(channel => ({
      label: channel.name,
      value: channel._id
    }));
  }

  const currentValueReplaced = () => {
    if (!currentValue) return {
      label: '',
      value: ''
    }

    const selected = channelList.find(ch => ch._id === currentValue);

    if (selected) return {
      label: selected.name,
      value: selected._id
    }

    return {
      label: getTranslation('Invalid channel'),
      value: currentValue
    }
  }

  return <>
    <CustomSelect
      options={
        [...renderOptions()]
      }
      value={currentValueReplaced()}
      placeholder={getTranslation('Select a channel')}
      onChange={ev => {
        if (ev === null || isEmpty(ev)) {
          return onChange({ value: '' });
        }
        return onChange(ev);
      }}
    />

    {channelList.length === 0 &&
      <Wrapper
        flexBox
        justifyContent='flex-end'
        margin='6px 0 2px 0'>
        <Link to={`/workspace/${currentBot.workspaceId}/bot/${currentBot._id}/settings`} >{getTranslation('Create channel')}</Link>
      </Wrapper>
    }
  </>
}

const mapStateToProps = (state: any, ownProps: any) => ({
  currentBot: state.botReducer.currentBot
})

export default I18n(connect(
  mapStateToProps,
  {}
)(ChannelList));
