import { styled } from 'styled-components';

export const SegmentedWrapper = styled.div`
  .ant-segmented {
    background-color: white;
    border-radius: 8px;
    padding: 4px;
    transition: all 0.3s ease;
  }

  .ant-segmented-thumb {
    background-color: #e6f4ff !important;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .ant-segmented:not(.ant-segmented-disabled) .ant-segmented-item-selected {
    color: #1677ff !important;
    background-color: #e6f4ff;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .ant-segmented-item {
    transition: color 0.3s ease;
  }
`;
