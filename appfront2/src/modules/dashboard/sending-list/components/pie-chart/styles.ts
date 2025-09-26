import { Row } from 'antd';
import styled from 'styled-components';

export const ChartContainer = styled.div<{ shouldShowActions: boolean }>`
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: ${(props) => (props.shouldShowActions ? '430px' : '380px')};

  .highcharts-credits {
    display: none;
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
