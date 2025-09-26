import styled from 'styled-components';

const Header = styled.div`
    display: flex;
`;

const Body = styled.div`
    flex: 1;
    margin: 5px 0 8px 0;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const Wrapped = styled.div`
    p {
        margin: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;


export { Header, Body, Wrapped };
