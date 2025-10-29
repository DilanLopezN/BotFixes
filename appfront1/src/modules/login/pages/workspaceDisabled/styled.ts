import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
`;

const Logo = styled.img`
    width: 300px;
    margin: 0 20px 20px;
`;

const TextInfo = styled.span`
    font-size: 16px;
    margin: 0 20px;
`;


export {
    Content,
    Logo,
    TextInfo,
}
