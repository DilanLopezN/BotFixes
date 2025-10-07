import { Input } from 'antd';
import styled from 'styled-components';
import { TagColorBarProps, TagNameProps } from './interfaces';

export const SearchInput = styled(Input.Search)`
  width: 400px;
`;

export const TagCellContent = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
`;

export const TagColorBar = styled.div<TagColorBarProps>`
  width: 6px;
  height: 70px;
  margin-right: 16px;
  background-color: ${(props) => props.tagColor};
  opacity: ${(props) => (props.isInactive ? 0.4 : 1)};
`;

export const TagName = styled.span<TagNameProps>`
  font-size: 14px;
  font-weight: 500;
  opacity: ${(props) => (props.isInactive ? 0.6 : 1)};
  color: ${(props) => (props.isInactive ? '#999' : 'inherit')};
`;

export const InactiveStatusText = styled.span`
  margin-left: 8px;
  font-size: 12px;
  color: #999;
  font-weight: 400;
`;
