import React, { FC } from "react";
import styled from 'styled-components';

const Hr = styled.div`
    border-bottom: 2px #efefefc4 solid;
`;

const CardWrapperContent = styled.div`
    padding: 18px 15px;
    width: 100%;
`;

const CardWrapper: FC<{children?: React.ReactNode;}> = ({ children }) => {
    return <div>
        <CardWrapperContent>
            {children}
        </CardWrapperContent>
        <Hr />
    </div>
}

export default CardWrapper;
