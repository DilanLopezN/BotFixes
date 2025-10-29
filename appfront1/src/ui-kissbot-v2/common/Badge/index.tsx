import React, { FC } from 'react'
import styled from 'styled-components'
import { BadgeProps } from './props'

const Wrapper = styled.div<{ bgColor?: string, margin?: string, title?: string }>`
    font-size: 13px;
    font-weight: bold;
    border-radius: 10px;
    padding: 0px 5px;
    text-align: center;
    width: fit-content;
    height: fit-content;
    color: ${props => !props.color ? '#FFF' : props.color} !important;
    background-color: ${props => !props.bgColor ? '#808080' : props.bgColor};
    ${props => props.margin && `
        margin: ${props.margin};
    `};
    ${props => props.title && `
        title: ${props.title};
    `};
`

const Badge: FC<BadgeProps> = ({ children, label, color, bgColor, margin, title }) => {
    return <Wrapper color={color} bgColor={bgColor} margin={margin} title={title}>
        {label || children}
    </Wrapper>
}

export default Badge