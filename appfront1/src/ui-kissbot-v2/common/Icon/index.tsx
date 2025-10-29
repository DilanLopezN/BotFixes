import React from 'react'
import styled from 'styled-components'
import { IconProps } from './props'

const Wrapper = styled.div<any>`
  ${props => props.margin && `
    margin: ${props.margin};
  `}

  ${props => props.padding && `
    padding: ${props.padding};
  `}

  ${props => props.color && `
    color: ${props.color} !important;
  `}

  ${props => props.onClick && `
    cursor: pointer;
  `}
`

const IconTag = styled.i<any>`
  ${props => props.margin && `
    ::before {
      margin: ${props.margin}
    }
  `}
`

const Icon = ({ name, size, color, margin, padding, onClick, title, iconMargin, ...props }: IconProps) => {
  return <Wrapper margin={margin} color={color} onClick={onClick} title={title} padding={padding} {...props}>
    <IconTag className={`mdi mdi-${name} mdi-${size || '24px'}`} margin={iconMargin} />
  </Wrapper>
}

export default Icon