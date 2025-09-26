import styled from 'styled-components';

const Content = styled.div`
    padding: 10px;
    box-shadow: 1px 1px 3px 0px rgb(0 0 0 / 40%);
    background: #fdfdfd;
    background: #FFF;
    border-radius: 4px;
    flex: 1;
    
    &:not(:last-child) {
        margin-bottom: 10px;
    }
`;

const AppointmentDate = styled.div``;

const ButtonSend = styled.div`
    border-radius: 3px;
    height: 20px;
    color: #fff;
    background: #1c7bc3;
    font-size: 12px;
    padding: 0 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ButtonError = styled(ButtonSend)`
    background: #d02323;
`;

const ButtonSended = styled(ButtonSend)`
    background: green;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const AppointmentDetails = styled.div`
    margin: 8px 0 0 0;

    p {
        margin: 5px 0;
    }
`;

export {
    Content,
    AppointmentDetails,
    AppointmentDate,
    Actions,
    ButtonSend,
    ButtonError,
    ButtonSended
}