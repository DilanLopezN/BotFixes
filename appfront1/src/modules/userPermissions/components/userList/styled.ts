import { Select } from 'antd';
import styled from 'styled-components';
import { Wrapper, Card as BaseCard } from '../../../../ui-kissbot-v2/common';

const Card = styled(BaseCard)`
    transition: background-color 0.2s;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 15px;
    margin: -1px 0;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background-color: #f2f4f8;
    }
`;

const FiltersWrapper = styled(Wrapper)`
    display: grid;
    grid-template-columns: auto 1fr;
    padding: 0px 10px 15px 10px;
`;
const SelectStyle = styled(Select)`
    .ant-select-selection--single {
        height: 38px;
        padding: 4px;
    }
`;

export { Card, FiltersWrapper, SelectStyle};
