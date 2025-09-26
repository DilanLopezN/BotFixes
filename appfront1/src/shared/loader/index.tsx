import React, { FC } from 'react';
import styled from 'styled-components';
import { Wrapper } from '../../ui-kissbot-v2/common';

const Loading = styled.img<any>`
  ${props => `
    height: ${!!props.size ? `${props.size}px` : '40px'};
`}
`;

export interface LoaderProps {
    size?: number;
}

const Loader: FC<LoaderProps> = (props) => {
    return (
        <Wrapper
            flexBox
            justifyContent={'center'}
            alignItems={'center'}>
            <Loading src={'/assets/img/loading.gif'} {...props} />
        </Wrapper>
    )
}

export default Loader;