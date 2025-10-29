import { Row } from 'antd';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    height: 54px;
    align-items: center;
    background: #fff;
    border-radius: 5px;
    padding: 12px 15px;
    margin: 5px 0;
    gap: 15px;
    justify-content: space-between;
`;
const ContentRow = styled(Row)`
    align-items: center;
    gap: 15px;
`;

export { Content, ContentRow };
