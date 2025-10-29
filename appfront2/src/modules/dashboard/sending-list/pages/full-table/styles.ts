import { Select } from 'antd';
import styled from 'styled-components';

export const ScheduleTypeSelect = styled(Select)`
  width: 144px;
`;

export const ActionsCellContent = styled.div<{ $isCompact: boolean }>`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ $isCompact }) => ($isCompact ? 4 : 6)}px;
  width: 100%;

  .ant-btn + .ant-btn {
    margin-left: 0 !important;
  }
`;
