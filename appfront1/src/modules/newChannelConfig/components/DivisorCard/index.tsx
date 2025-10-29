

import { FC } from "react";
import { DivisorCardProps } from "./props";
import { Wrapper } from "../../../../ui-kissbot-v2/common";
import './style.scss';

const DivisorCard: FC<DivisorCardProps> = (props) => {
  const {
    title,
    children,
    icon,
    onClick,
    iconTitle
  } = props;

  return (
    <Wrapper
      className='DivisorCard'
      bgcolor='#FFF'
      borderRadius='7px'
      padding='15px 25px 20px 25px'
      width='100%'
      margin='0 0 30px 0'
    >
      <Wrapper
        flexBox
        alignItems='center'
        justifyContent='space-between'>
        <Wrapper
          fontSize='15pt'
          color='#555'
        >
          {title}
        </Wrapper>
        {icon && onClick
          && <Wrapper
            onClick={onClick}>
            <span className={`mdi mdi-24px mdi-${icon}`} style={{ cursor: 'pointer' }} title={iconTitle} />
          </Wrapper>}
      </Wrapper>

      <Wrapper
        margin='25px 0 0 0 '>
        {children}
      </Wrapper>
    </Wrapper>
  )
}

export default DivisorCard;
