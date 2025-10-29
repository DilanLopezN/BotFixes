import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #e8e8e8;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #999999;
        border-radius: 10px;
    }
`;

const Content = styled(Scroll)`
    display: flex;
    flex-direction: row;
    overflow-x: hidden;
    height: 100%;
    overflow-y: auto;
    padding: 0 10px;
    margin-bottom: 10px;

    .ant-table-body {
        height: 350px;
    }
`;

const ContentLabel = styled.div`
    padding: 0 10px 8px 10px;
    margin-top: -5px;
    font-size: 14px;
    font-weight: bold;
`

const EmptyDataInfo = styled.div`
    text-align: center;
    margin: 20px 0;
`;

export { EmptyDataInfo, Content, ContentLabel };
