import styled from 'styled-components';

export const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => !['height', 'minHeight', 'shouldRenderExtraPadding'].includes(prop),
})<{
  height?: number | string;
  minHeight?: string;
  shouldRenderExtraPadding?: boolean;
}>`
  display: flex;
  flex-direction: column;
  padding-bottom: ${({ shouldRenderExtraPadding }) =>
    shouldRenderExtraPadding ? '16px' : undefined};

  .ant-table-body {
    height: ${({ height }) => height};
    min-height: ${({ minHeight }) => minHeight || undefined};
    // overflow-y: auto !important;
    border: 1px solid #f0f0f0;
  }

  .ant-pagination-total-text {
    margin-right: auto;
  }
`;
