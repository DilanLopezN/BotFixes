import React, { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { TagItemProps } from './props';
import styled from 'styled-components';
const defaultColor = '#698474';

const Item = styled(Wrapper)`
 height: 32px;
 margin: 2px 1px;
 border-radius: 4px;
 width: 100%;
 align-items: center;
 padding: 0 0 0 10px;
 max-width: 220px;
 cursor: pointer;
 justify-content: space-between;

 transition: 0.5s all ease;

    :hover {
      -webkit-transform: scale(0.95);
        -ms-transform: scale(0.95);
        transform: scale(0.95);
    }
`

const TagItem: FC<TagItemProps> = ({
  tag,
  onSelect,
  selected,
}) => {
  return <Wrapper
    alignItems='center'
    flexBox
  >
    <Item
      bgcolor={tag.color || defaultColor}
      flexBox
      onClick={() => {
        onSelect();
      }}>
      <Wrapper
        truncate
        color="#FFF"
        fontSize='13px'>
        {tag.name && tag.name}
      </Wrapper>
      <Wrapper
        flexBox
        margin='0 5px'>
        {selected
          && <span
            style={{ color: '#FFF' }}
            className="mdi mdi-12px mdi-checkbox-marked-circle" />
        }
      </Wrapper>
    </Item>

  </Wrapper>
}

export default TagItem;