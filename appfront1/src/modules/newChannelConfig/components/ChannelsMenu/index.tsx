import React, { FC } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import { ChannelsMenuProps } from './props'

const ChannelsMenu: FC<ChannelsMenuProps> = (props) => {

    const {
        onSelect,
        options,
        selected,
        channelId
    } = props;

    return (
        <Wrapper
            bgcolor='#FFF'
            padding='5px 0 0 0'
            margin='0 0 12px 0'
        >
            <Wrapper
                flexBox
                borderBottom='1px #e2e2e2 solid'
                height='45px'
                padding='0 20px'
                alignItems='center'>
                {options.map(option => {
                    if (option.showOnChannelIdEquals.includes(channelId))
                        return <Wrapper
                            key={option.ref}
                            padding='0 10px'
                            margin='0 15px'
                            flexBox
                            height='45px'
                            alignItems='center'
                            cursor='pointer'
                            borderBottom={`2px ${option.ref === selected.ref ? '#007bff' : 'transparent'} solid`}
                            onClick={() => onSelect(option)}>
                            {option.label}
                        </Wrapper>
                })}
            </Wrapper>
        </Wrapper>
    )
}

export default ChannelsMenu
