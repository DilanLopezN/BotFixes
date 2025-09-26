import styled from 'styled-components';

const Content = styled.div`
   margin: 20px 0 0 0;

   h6 {
       color: #555;
       font-size: 14px;
   }
`;

const AppointmentsArea = styled.div`
    margin: 18px 0 0 0;
`;

const ReloadAppointments = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Loading = styled.img`
    height: 40px;
`;

export { Content, AppointmentsArea, Loading, ReloadAppointments }