import React, { useState } from 'react'
import styled from 'styled-components'
import { CollapseMenuProps } from './props'
import { Icon } from '..'

const MenuWrapper = styled.div`
  width: 300px;
  min-height: 600px;
  background-color: #F3F3F4;
  font-size: 20px;
  padding: 12px;
`

const Title = styled.div`
  background-color: #DEDFE3;
  border: 1px solid #DDD;
  border-radius: 4px;
  box-sizing: border-box;
  padding: 10px 14px;
  color: #000;
  margin-bottom: 15px;
`

const Item = styled.div`
  margin-top: 10px;
`

const ItemLabel = styled.div`
  background-color: #FFF;
  border: 1px solid #DDD;
  border-radius: 4px;
  box-sizing: border-box;
  padding: 8px 12px;
  color: #000;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
`

const IconWrapper = styled.div`
  color: #000;
  display: flex;
  align-content: flex-end;
  align-items: center;
  justify-content: center;
`

const ItemWrapper = styled.div<{ open: boolean }>`
  height: auto;
  max-height: 0px;
  overflow: hidden;
  transition: max-height 0.5s ease;

  ${props => !!props.open && `
    max-height: 800px;
  `}
`

const SubItem = styled.div`
  color: #333;
  font-size: 16px;
  padding-left: 20px;
  margin-top: 10px;

  ${props => !!props.onClick && `
    cursor: pointer;
  `}
`

const CollapseMenu = ({ title, itens }: CollapseMenuProps) => {

  const [selectedItem, setSelectedItem] = useState<number | undefined>(0)

  const selectItem = (index, setSelectedItem) => {
    setSelectedItem(index === selectedItem ? undefined : index)
  }

  return <MenuWrapper key="collapseMenu">
    <Title>{title}</Title>

    {itens.map((item, index) => (
      <Item key={`itemKey${index}`}>
        <ItemLabel onClick={() => selectItem(index, setSelectedItem)}>
          {item.label}
          <IconWrapper>
            <Icon name={selectedItem === index ? 'chevron-down' : 'chevron-up'} size="12px" />
          </IconWrapper>
        </ItemLabel>

        <ItemWrapper open={selectedItem === index} key={`itemWrapperKey${index}`}>
          {item.subItens.map((subItem, i) => (
            <SubItem key={`subItemKey${index}${i}`} onClick={() => !!subItem.onClick && subItem.onClick()}>
              {subItem.label}
            </SubItem>
          ))}
        </ItemWrapper>
      </Item>
    ))}
  </MenuWrapper>
}

export default CollapseMenu