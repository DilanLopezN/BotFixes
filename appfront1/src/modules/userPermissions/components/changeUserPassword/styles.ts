import styled from 'styled-components';

const ActionsArea = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 15px 0 0 0;
`;

const Content = styled.div`
    padding: 15px 20px;
`;

const Button = styled.div`
    color: #1890ff;
    text-decoration: none;
    display: flex;
    justify-content: flex-end;
`;

const PasswordInfo = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 0 15px 0;
    align-items: center;
`;

export {
    ActionsArea,
    Content,
    Button,
    PasswordInfo,
}
