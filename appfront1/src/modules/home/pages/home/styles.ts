import styled from 'styled-components';
import P from '../../../../shared/Page';

const CardInfo = styled.div`
    padding: 10px 10px 10px 10px;
`;

const WorkspaceListArea = styled.div`
    border-radius: 5px;
    max-width: 1200px;
    margin: 0 auto;
`;

const WrapperInfo = styled.div`
    padding: 25px 0 10px 0;
    position: sticky;
    top: 0;
    background: #f2f4f8;
`;

const Page = styled(P)`
    .content {
        margin: 0;
        padding: 0 25px 25px 25px;
    }
`;

export { CardInfo, WorkspaceListArea, WrapperInfo, Page };
