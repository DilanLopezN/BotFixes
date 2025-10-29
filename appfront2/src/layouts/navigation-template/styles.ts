import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

export const SideMenu = styled.div`
  width: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 0 10px 0;

  svg {
    font-size: 26px;
    color: #fff;
  }
`;

export const TopLevelOptions = styled.div``;

export const LogoImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 10px 0 15px 0;
`;

export const LogoImage = styled.img`
  height: 36px;
`;

export const OptionItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  margin: 7px;
  border-radius: 5px;
  cursor: pointer;

  ${(props) =>
    props.selected &&
    `
        background: #ebebeb26;
    `}
`;

export const Anchor = styled.a`
  color: #1890ff !important;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const BottomLevelOptions = styled.div``;

export const ChildArea = styled.div`
  overflow-y: auto;
  width: 100%;
  height: 100vh;
  background: #fff;
`;
