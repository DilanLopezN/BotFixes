import { Row, Typography } from 'antd';
import styled from 'styled-components';

export const SpanCapitalize = styled.span`
  text-transform: capitalize;
`;

export const UserListContainer = styled.div`
  .ant-pagination {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
`;
export const StyledSummaryContainer = styled.div`
  display: flex;
`;
export const TableFiltersContainer = styled(Row)`
  padding-bottom: 16px;
  align-items: center;
`;

export const Title = styled(Typography.Title)`
  padding: 0 !important;
  margin: 0 !important;
  text-align: center;
`;
