import React, { useEffect, FC, useState } from 'react'
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import I18n from '../../modules/i18n/components/i18n';
import { ChannelIdConfig } from 'kissbot-core';
import { CustomCreatableSelect } from '../StyledForms/CustomCreatableSelect/CustomCreatableSelect';

export interface ChannelListProps extends I18nProps {
  currentValue: string;
  workspaceId: string;
  onChange: (...params) => any;
  channelIdToIgnore: string[]
}

const ChannelIdList: FC<ChannelListProps> = (props) => {

  const {
    currentValue,
    onChange,
    getTranslation
  } = props;

  const [channelIdList, setChannelIdList] = useState<string[]>([]);

  useEffect(() => {
    getChannelId()
  }, [])

  const getChannelId = async () => {

    const channelIdList = Object.values(ChannelIdConfig);
    setChannelIdList(channelIdList)

  }

  const renderOptions = () => {
    return channelIdList.map(channelId => ({
      label: channelId,
      value: channelId
    }));
  }

  const currentValueReplaced = () => {
    if (!currentValue) return {
      label: '',
      value: ''
    }
    return {
      label: currentValue,
      value: currentValue
    }
  }

  return <CustomCreatableSelect
    options={
      [...renderOptions()]
    }
    placeholder={getTranslation('Select a channel')}
    value={currentValueReplaced()}
    onCreateOption={(ev) => {
      onChange({ value: ev });
    }}
    onChange={ev => {
      if (ev === null || isEmpty(ev)) {
        return onChange({ value: '' });
      }
      return onChange(ev);
    }}
  />
}

const mapStateToProps = (state: any, ownProps: any) => ({})

export default I18n(connect(
  mapStateToProps,
  {}
)(ChannelIdList));
