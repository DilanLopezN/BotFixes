import { Table as T } from 'antd';
import styled from 'styled-components';

const Card = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #152d4c;
    width: 50%;
    min-width: 400px;
    height: 100%;
    min-height: 100px;
    padding: 8px;
    border-radius: 10px;
    font-weight: bold;
    font-size: clamp(1.8rem, 2vw, 2.3rem);
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;

    * {
        color: #fff !important;
    }

    div {
        font-size: clamp(2rem, 2.2vw, 2.6rem);
    }

    @media screen and (min-width: 3000px) {
        min-width: 700px;
        font-size: clamp(2.8rem, 3vw, 3.5rem);
        div {
            font-size: clamp(3rem, 3.2vw, 3.7rem);
        }
    }

    @media screen and (min-width: 4500px) {
        min-width: 900px;
        font-size: clamp(3.5rem, 4vw, 4.5rem);
        div {
            font-size: clamp(3.7rem, 4vw, 4.8rem);
        }
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #f0f8ff;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    padding: 10px 35px 10px 35px;
`;

const Table = styled(T)`
    .ant-table-title {
        background: #f0f8ff;
        padding-bottom: 16px !important;
    }

    .ant-table-tbody > tr > td {
        padding: 10px;
    }

    .ant-table-thead > tr > th {
        padding: 12px;
    }

    .ant-table tfoot > tr > td {
        padding: 12px;
    }

    tbody {
        font-size: clamp(1.4rem, 1.5vw, 1.7rem) !important;
    }

    thead {
        .ant-table-column-title {
            color: #ffffff !important;
        }
    }

    thead .columnHeader,
    tfoot {
        background: #152d4c !important;
        font-size: clamp(1.5rem, 1.6vw, 1.8rem) !important;
    }

    .table-row-light {
        background: #ffffff;
    }

    .table-row-dark {
        background: #f7f7f7;
    }

    td.ant-table-column-sort {
        background: inherit;
    }

    @media screen and (min-width: 3000px) {
        tbody {
            font-size: clamp(2rem, 2.2vw, 2.6rem) !important;
        }

        thead .columnHeader,
        tfoot {
            font-size: clamp(2.2rem, 2.5vw, 2.8rem) !important;
        }

        .ant-table-tbody > tr > td {
            padding: 12px;
        }

        .ant-table-thead > tr > th {
            padding: 14px;
        }

        .ant-table tfoot > tr > td {
            padding: 14px;
        }
    }

    @media screen and (min-width: 4500px) {
        tbody {
            font-size: clamp(2.6rem, 2.7vw, 3rem) !important;
        }

        thead .columnHeader,
        tfoot {
            font-size: clamp(2.8rem, 3vw, 3.2rem) !important;
        }

        .ant-table-tbody > tr > td {
            padding: 16px;
        }

        .ant-table-thead > tr > th {
            padding: 16px;
        }

        .ant-table tfoot > tr > td {
            padding: 16px;
        }
    }
`;

const ContentImg = styled.div`
    display: flex;
    justify-content: center;
`;

const ImgStyle = styled.img`
    height: 100px;
    width: 30vw;
    min-width: 150px;

    @media screen and (min-width: 3000px) {
        height: 200px;
        min-width: 250px;
    }

    @media screen and (min-width: 4500px) {
        height: 250px;
        min-width: 350px;
    }
`;

export { Content, Card, Table, ContentImg, ImgStyle };
