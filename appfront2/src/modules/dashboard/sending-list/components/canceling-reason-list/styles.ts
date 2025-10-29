import { styled } from 'styled-components';

export const Container = styled.div`
  .ant-table-row {
    cursor: pointer;
  }
  .ant-table-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .ant-pagination-total-text {
    margin-right: auto;
  }
`;
