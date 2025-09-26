import React, { FC, useState, useEffect } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import Header from '../Header'
import { ChannelListProps } from './props';
import ChannelCard from '../ChannelCard';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ChannelIdConfig } from 'kissbot-core';
import ModalChannels from '../ModalChannels';
import { ScrollView } from '../ScrollView';

const ChannelList: FC<ChannelListProps> = (props) => {
  const {
    menuSelected,
    getTranslation,
    channelList,
    addNotification,
    referencePage,
    workspaceChannelList
  } = props;

  const channels = (type: ChannelIdConfig) => currChannelList.filter(channel => channel.channelId === type);

  const [channelIdSelected, setChannelIdSelected] = useState<string | undefined>(undefined)

  const getChannelList = () => {
    if (referencePage === 'workspace')
      return workspaceChannelList;
    else if (referencePage === 'bot')
      return channelList

    return workspaceChannelList;
  }

  const [currChannelList, setCurrChannelList] = useState(getChannelList())

  useEffect(() => {
    if (referencePage === 'workspace')
      setCurrChannelList(workspaceChannelList)

    else if (referencePage === 'bot')
      setCurrChannelList(channelList)

  }, [channelList, workspaceChannelList])

  const openModal = (type: string) => setChannelIdSelected(type)

  return (
    <>
      {channelIdSelected
        && <ModalChannels
          addNotification={addNotification}
          opened={!!channelIdSelected}
          channelConfigId={channelIdSelected}
          referencePage={referencePage}
          onClose={() => setChannelIdSelected(undefined)}
        />}
      <Wrapper>
        <Header
          title={menuSelected.title}
        >
        </Header>
      </Wrapper>
      <ScrollView>
        <Wrapper
          height='100%'
          margin='0 auto'
          maxWidth='1245px'
          padding={'10px'}
        >
          <Wrapper
            flexBox>
            <ChannelCard
              image='/assets/icons/bot.svg'
              mdi='robot'
              title='Emulator'
              description='Canal utilizado para testar seu bot durante o desenho do mesmo. Não deve ser compartilhado.'
              openModal={(channelConfigId: string) => openModal(channelConfigId)}
              list={channels(ChannelIdConfig.webemulator)}
              channelId={ChannelIdConfig.webemulator}
              addNotification={addNotification}
              multiple={false}
              referencePage={referencePage}
            />

            <ChannelCard
              image='/assets/icons/bot.svg'
              title='Webchat'
              mdi='robot'
              description='Este é o canal de seu bot. Se o atendimento for feito em uma página da web, compartilhe este canal.'
              openModal={(channelConfigId: string) => openModal(channelConfigId)}
              list={channels(ChannelIdConfig.webchat)}
              channelId={ChannelIdConfig.webchat}
              addNotification={addNotification}
              multiple={true}
              referencePage={referencePage}
            />
            <ChannelCard
              image='/assets/icons/whats-icon.svg'
              mdi='whatsapp'
              title={`WhatsApp ${getTranslation('Official')}`}
              description='Utilizado quando o atendimento será feito via whatsApp. O bot irá responder por lá. :)'
              openModal={(channelConfigId: string) => openModal(channelConfigId)}
              list={channels(ChannelIdConfig.gupshup)}
              channelId={ChannelIdConfig.gupshup}
              addNotification={addNotification}
              multiple={true}
              referencePage={referencePage}
            />
          </Wrapper>
          <Wrapper
            flexBox>
            <ChannelCard
              image='/assets/icons/whats-icon.svg'
              mdi='near-me'
              title={`Telegram`}
              description='Utilizado quando o atendimento será feito via Telegram. O bot irá responder por lá. :)'
              openModal={(channelConfigId: string) => openModal(channelConfigId)}
              list={channels(ChannelIdConfig.telegram)}
              channelId={ChannelIdConfig.telegram}
              addNotification={addNotification}
              multiple={true}
              referencePage={referencePage}
            />
          </Wrapper>
        </Wrapper>
      </ScrollView>
    </>
  )
}

const mapStateToProps = (state: any, ownProps: any) => ({
  channelList: state.botReducer.channelList,
  workspaceChannelList: state.workspaceReducer.channelList,
})

export default I18n(withRouter(connect(
  mapStateToProps,
  null
)(ChannelList)));
