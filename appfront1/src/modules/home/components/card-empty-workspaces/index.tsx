import { FC } from 'react';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    flex: 1;

    img {
        height: 200px;
    }

    p {
        margin: 30px 0 0 0;
        color: #555;
        text-align: center;

        span {
            display: block;
        }
    }
`;

interface CardEmptyWorkspacesProps {
    children?: React.ReactNode;
}

const CardEmptyWorkspaces: FC<CardEmptyWorkspacesProps> = ({children}) => {
    return (
        <Content>
            <img src='/assets/img/undraw_not_found.svg' />
            {children}
        </Content>
    );
};

export default CardEmptyWorkspaces;
