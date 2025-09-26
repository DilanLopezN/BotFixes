import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { HeaderProps } from './props';

const Header: FC<HeaderProps> = (props) => {
    const { title, action, style } = props;

    return (
        <Wrapper
            flexBox
            justifyContent='space-between'
            height='70px'
            fontSize='16pt'
            color='#555'
            bgcolor='#f2f4f8'
            padding='20px 25px 15px 25px'
            alignItems='center'
            style={style}
        >
            {title}
            {action}
        </Wrapper>
    );
};

export default Header;
