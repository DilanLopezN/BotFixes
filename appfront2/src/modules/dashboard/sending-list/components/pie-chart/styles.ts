import { Row } from 'antd';
import styled from 'styled-components';

export const ChartContainer = styled.div<{ $shouldShowActions: boolean }>`
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: ${(props) => (props.$shouldShowActions ? '430px' : '380px')};

  .highcharts-credits {
    display: none;
  }
  .highcharts-contextmenu {
    z-index: 10000 !important;
    max-height: 250px !important;
    overflow-y: auto !important;
    padding: 4px 0 !important;
    border-radius: 6px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 4px;
      margin: 4px 0;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border: 1px solid transparent;
      background-clip: padding-box;

      &:hover {
        background: rgba(0, 0, 0, 0.4);
      }
    }
  }

  .highcharts-menu-item {
    padding: 10px 16px !important;
    transition: background-color 0.15s ease !important;

    &:hover {
      background-color: #f0f0f0 !important;
    }
  }
`;

export const ChartTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #828282;
`;

export const ChartCount = styled.span`
  font-family: Roboto;
  font-size: 28px;
  font-weight: 500;
  line-height: 47px;
  color: #0b1354;
`;

export const ChartActionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: flex-end;
`;

export const EmptyChartContainer = styled(Row)`
  padding: 44px 32px 0 32px;
`;

export const EmptyChartText = styled.span`
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  color: #6c6e79;
`;
