import { styled } from 'styled-components';
import { EnhancedTable } from '~/components/enhanced-table';

export const DownloadLink = styled.a`
  :hover {
    pointer-events: none;
  }
`;

export const AttributeTable = styled(EnhancedTable)`
  .ant-table-cell {
    height: 39px !important;
  }
`;
