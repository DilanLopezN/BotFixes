import { styled } from 'styled-components';

export const TableContainer = styled.div`
  .editable-cell {
    position: relative;
  }

  .editable-cell-value-wrap {
    padding: 5px 12px;
    cursor: pointer;
  }

  .editable-row:hover .editable-cell-value-wrap,
  .editable-row-fail:hover .editable-cell-value-wrap,
  .editable-row-duplicate-phone:hover .editable-cell-value-wrap {
    padding: 4px 11px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
  }

  .editable-row-fail .ant-table-cell,
  .editable-row-duplicate-phone .ant-table-cell {
    background-color: #fff1f0 !important;
  }

  .editable-row .ant-table-cell-fix-left,
  .editable-row .ant-table-cell-fix-right {
    background: #fff !important;
  }

  .editable-row-fail .ant-table-cell-fix-left,
  .editable-row-fail .ant-table-cell-fix-right {
    background-color: #fff1f0 !important;
  }
`;
