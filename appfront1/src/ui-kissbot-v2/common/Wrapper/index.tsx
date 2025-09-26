import React, { FC } from 'react'
import styled from 'styled-components'
import { WrapperProps } from './props'

const Wrap = styled.div <any>`
  ${props => !!props.flex && `
    flex: ${props.flex === true ? '1' : props.flex};
  `}

  ${props => !!props.flexNone && `
    flex: none;
  `}

  ${props => !!props.flexBox && `
    display: flex;
    flex-direction: row;
  `}

  ${props => !!props.flexWrap && `
    flex-wrap: ${props.flexWrap};
  `}

  ${props => !!props.column && `
    flex-direction: column;
  `}

  ${props => !!props.justifyContent && `
    justify-content: ${props.justifyContent};
  `}

  ${props => !!props.alignItems && `
    align-items: ${props.alignItems};
  `}

  ${props => !!props.flexDirection && `
    flex-direction: ${props.flexDirection};
  `}

  ${props => !!props.scroll && `
    overflow: scroll;
  `}

  ${props => !!props.color && `
    color: ${props.color};
  `}

  ${props => !!props.bgcolor && `
    background-color: ${props.bgcolor};
  `}

  ${props => !!props.opacity && `
    opacity: ${props.opacity};
  `}

  ${props => !!props.truncate && `
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  `}

  ${props => !!props.width && `
    width: ${props.width};
  `}

  ${props => !!props.maxWidth && `
    max-width: ${props.maxWidth};
  `}

  ${props => !!props.minWidth && `
    min-width: ${props.minWidth};
  `}

  ${props => !!props.margin && `
    margin: ${props.margin};
  `}

  ${props => !!props.padding && `
    padding: ${props.padding};
  `}

  ${props => !!props.border && `
    border: ${props.border};
  `}

  ${props => !!props.borderRadius && `
    border-radius: ${props.borderRadius};
  `}

  ${props => !!props.borderLeft && `
    border-left: ${props.borderLeft};
  `}

  ${props => !!props.borderRight && `
    border-right: ${props.borderRight};
  `}

  ${props => !!props.borderBottom && `
    border-bottom: ${props.borderBottom};
  `}

  ${props => !!props.borderTop && `
    border-top: ${props.borderTop};
  `}

  ${props => !!props.textAlign && `
    text-align: ${props.textAlign};
  `}

  ${props => !!props.fontSize && `
    font-size: ${props.fontSize};
  `}

  ${props => !!props.fontWeight && `
    font-weight: ${props.fontWeight};
  `}

  ${props => !!props.overflowY && `
    overflow-y: ${props.overflowY};
  `}

  ${props => !!props.overflowX && `
    overflow-x: ${props.overflowX};
  `}

  ${props => !!props.height && `
    height: ${props.height};
  `}

  ${props => !!props.minHeight && `
    min-height: ${props.minHeight};
  `}

  ${props => !!props.lineHeight && `
    line-height: ${props.lineHeight};
  `}

  ${props => !!props.position && `
    position: ${props.position};
  `}

  ${props => !!props.cursor && `
    cursor: ${props.cursor};
  `}

  ${props => !!props.top && `
    top: ${props.top};
  `}

  ${props => !!props.bottom && `
    bottom: ${props.bottom};
  `}

  ${props => !!props.left && `
    left: ${props.left};
  `}

  ${props => !!props.right && `
    right: ${props.right};
  `}

  ${props => !!props.display && `
    display: ${props.display};
  `}

  ${props => !!props.maxHeight && `
    max-height: ${props.maxHeight};
  `}

  ${props => !!props.boxShadow && `
    -webkit-box-shadow: ${props.boxShadow};
    -moz-box-shadow: ${props.boxShadow};
    box-shadow: ${props.boxShadow};
  `}

  ${props => !!props.bgImage && `
    background-image: ${props.bgImage};
  `}

  ${props => !!props.outline && `
    outline: ${props.outline};
  `}

  ${props => !!props.visibility && `
    visibility: ${props.visibility};
  `}
`

const Wrapper: FC<WrapperProps & { className?: string | undefined; children?: React.ReactNode }> = (props) => {
  const wrapProps = { ...props }

  return <React.Fragment>
    <Wrap {...wrapProps} >
      {!!props.children && props.children}
    </Wrap>
  </React.Fragment>
}

export default Wrapper;
