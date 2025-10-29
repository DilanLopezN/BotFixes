import React, { FC, useState, useEffect } from 'react'
import styled from 'styled-components';
import { Wrapper } from '../../../ui-kissbot-v2/common';
import { InputColorProps } from './props';
import { SketchPicker } from 'react-color'
import I18n from '../../../modules/i18n/components/i18n';
import MaskedInput from 'react-text-mask'
import './style.scss';
import Popover from 'react-popover';
import ClickOutside from 'react-click-outside'

const Input = styled(MaskedInput)`
    box-shadow: 0 2px 15px 0 rgba(0,0,0,.07);
    background: var(--color8);
    border: 1px solid #d9d9d9;
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 42px;
    max-height: none;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    ::placeholder {
      color: var(--color5);
    }
    :hover {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;

const InputColor: FC<InputColorProps> = (props) => {
  const [modalOpened, setModalOpened] = useState<boolean>(false)
  const [color, setColor] = useState<string | undefined>(undefined)

  const {
    name,
    onChange,
    getTranslation,
    onBlur,
    value
  } = props;

  useEffect(() => {
    setColor(colorFormat(value))
  }, [value])

  // const debounceColor = useCallback(debounce((color: any) => setColor(color.hex), 500), [])

  const replaceColor = (ev) => {
    onChange(ev.target.value);
  }

  const colorFormat = (color: string) => {
    return color.length === 7 ? color.substring(1, 7) : color;
  }

  return (
    <Wrapper
      alignItems='center'
      position='relative'
      flexBox>
      <Wrapper
        position='relative'
      >
        <span style={{
          position: 'absolute',
          fontSize: '17px',
          left: '4px',
          top: '9px',
          color: `#${color}`,
          fontWeight: 600,
        }}>#</span>
        <Input
          className='form-control form-control-sm'
          name={name}
          placeholder={getTranslation('Color')}
          onChange={replaceColor}
          guide={false}
          onBlur={onBlur}
          value={value}
          maxLength='6'
          mask={s => Array.from(s).map(() => /^[0-9a-fA-F]$/)}
        />
      </Wrapper>
      <Popover
        isOpen={modalOpened}
        body={
          <ClickOutside onClickOutside={() => {
            setModalOpened(false)
          }}>
            {<Wrapper
              margin='6px 0 10px 0'>
              <SketchPicker
                disableAlpha
                color={`#${color}`}
                onChangeComplete={(color) => {
                  setColor(colorFormat(color.hex));
                  onChange(colorFormat(color.hex));
                }}
              />
            </Wrapper>}
          </ClickOutside>
        }
        preferPlace={'below'}
        children={
          <Wrapper
            key="inputColorChildren"
            width='37px'
            padding='3px'
            margin='0 0 0 2px'
            onClick={() => setModalOpened(true)}
            height='37px'
            cursor='pointer'
            position='absolute'
            right='3px'
          >
            <Wrapper
              width='100%'
              border='1px #fafafa solid'
              borderRadius='3px'
              height='100%'
              bgcolor={`#${color}`}
            />
          </Wrapper>
        }
      />
    </Wrapper>
  )
}


export default I18n(InputColor)
