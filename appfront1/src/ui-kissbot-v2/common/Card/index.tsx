import React, { FunctionComponent } from 'react'
import styled from 'styled-components'
import { getColor } from '../../theme';
import CardProps from './props'

const CardWrapper = styled.div<CardProps>`
  display: flex;
  flex-direction: ${props => !!props.flexDirection ? props.flexDirection : 'column'};

  width: ${props => !!props.width ? props.width : '100%'};

  ${props => !!props.height && `
    height: ${props.height};
  `}

  border: ${props => !!props.border
    && (
         !props.borderRight
      || !props.borderLeft
      || !props.borderBottom
      || !props.borderTop) ? props.border : '1px solid #CED4DA'};

  padding: ${props => !!props.padding ? props.padding : '8px 10px'};

  background-color: ${props =>
    !!props.selected
      ? !props.colorType
        ? '#696969'
        : getColor(props.colorType)
      : '#FFF'
  };

  color: ${props =>
    !!props.selected
      ? !props.colorType
        ? !!props.selectedColor ? props.selectedColor : '#FFF'
          : getColor(props.colorType)
      : '#696969'
  };

  ${props => !!props.position && `
    position: ${props.position};
  `}

  ${props => !!props.margin && `
    margin: ${props.margin};
  `}

  ${props => !!props.cursor && `
    cursor: ${props.cursor};
  `}

  ${props => !!props.disabled && `
    opacity: 0.2;
    user-select: none;
    color: #CECECECE;
  `}

  border-radius: ${props => !!props.borderRadius ? props.borderRadius : '.30rem'};

  ${(props: CardProps) => !!props.labelColor && `
    position: relative;
    overflow-y: hidden;
    &:after {
        content: " ";
        position: absolute;
        width: 5px;
        height: 100%;
        left: 0;
        top: 0;
        background: ${props.labelColor || (props.colorType ? getColor(props.colorType) : "#007BFF")};
    }
  `}

  ${props => !!props.borderTop && `
    border-top: ${props.borderTop};
  `}

  ${props => !!props.borderBottom && `
    border-bottom: ${props.borderBottom};
  `}

  ${props => !!props.borderRight && `
    border-right: ${props.borderRight};
  `}

  ${props => !!props.borderLeft && `
    border-left: ${props.borderLeft};
  `}

  ${props => !!props.justifyContent && `
    justify-content: ${props.justifyContent};
  `}
`

const CardHeader = styled.h5<CardProps>`
  font-size: ${props => props.styleHeader?.fontSize ?? '12px'};
  ${props => props.styleHeader?.height && `
    height: ${props.styleHeader.height}
  `};
  padding: ${props => props.styleHeader?.padding ?? '8px 10px'};
  text-transform: ${props => props.styleHeader?.textTransform ?? 'uppercase'};
  font-weight: ${props => props.styleHeader?.fontWeight ?? 'bold'};
  color: ${props => props.styleHeader?.color ?? '#776990'};
  border-bottom: 1px solid #000;
  background-color: ${props => props.styleHeader?.bgColor ?? '#FAF9FB'};
  margin-bottom: 0;
  border: 1px solid #CED4DA;
  border-radius: 0.30rem 0.30rem 0 0;
`;

const Card = (props: CardProps) => {
  if (props.header) {
    return (
      <>
        {props.header && <CardHeader {...props} >{props.header}</CardHeader>}

        <CardWrapper {...props} borderTop="none" borderRadius="0 0 0.30rem 0.30rem" />
      </>
    );
  }

  return (<CardWrapper  {...props} />);
};

export default Card as FunctionComponent<CardProps & { className?: string, title?: string }>;
