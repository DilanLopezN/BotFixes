import styled from 'styled-components';
import { OptionItem } from '../styles';

export const Container = styled.div``;

export const Content = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-direction: column;

  svg {
    color: #fff;
    cursor: pointer;
    font-size: 25px;
  }

  span {
    color: #fff;
    font-size: 10px;
    text-align: center;
  }
`;

export const OptionItemWithLabel = styled(OptionItem)<{ selected?: boolean }>`
  flex-direction: column;
  height: 58px;
  line-height: 16px;

  .title {
    color: #fff;
    font-size: 10px;
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

export const PopoverWrapper = styled.div`
  bottom: 10px;
  left: 70px;
  background: #fff;
  max-height: 45vh;
  z-index: 9999;
`;

export const SearchBarContainer = styled.span`
  width: 100%;
`;

export const WorkspaceList = styled.div`
  width: 230px;
  max-height: 40vh;
  min-height: 40vh;
  overflow-x: hidden;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #e8e8e8;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #999999;
    border-radius: 10px;
  }
`;

export const WorkspaceCard = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 5px 8px 0;
  margin: 3px 0;
  cursor: pointer;

  svg {
    color: #284975e8;
    font-size: 22px;
    min-width: 30px;
    cursor: pointer;
    margin: 0 8px 0 0;
  }

  div {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  ${(props) =>
    props.selected &&
    `
        border-left: 3px #284975e8 solid;
    `}

  &.workspaceSelected {
    background: #e8e8e8;
  }
`;

export const WorkspaceName = styled.span`
  color: #696969;
`;

export const NoResultsFoundContainer = styled.div`
  width: 230px;
  height: 40vh;
  padding: 20px 40px;
`;

export const NoResultIconContainer = styled.div`
  display: flex;
  margin: 30px 0 0 0;
  justify-content: center;
`;

export const NotResultsMessage = styled.div`
  display: flex;
  text-align: center;
  margin: 30px 0;
`;
