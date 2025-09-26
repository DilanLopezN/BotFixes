import styled from 'styled-components';

const Content = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2f4f8;
`;

const Card = styled.div`
    box-shadow: 4px 1px 17px -5px #dbdbdb;
    padding: 15px 20px;
    min-width: 350px;
    max-width: 350px;
    border-radius: 10px;
    background: #fff;
`;

const Logo = styled.img`
    width: 100%;
    margin: 0 0 40px 0;
    padding: 0 20px;
`;

const InfoExpired = styled.div`
    width: 100%;
    text-align: center;
    margin: 0 0 25px 0;
    color: #555;
    font-weight: 600;
    font-size: 14px;
`;

export {
    Content,
    Logo,
    Card,
    InfoExpired
}
