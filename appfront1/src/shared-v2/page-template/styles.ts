import styled from 'styled-components';
import { HeaderProps } from './interfaces';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: auto;
    background-color: #fafafa;
`;

export const HeaderContainer = styled.div<HeaderProps>`
    display: flex;
    position: sticky;
    top: 0;
    align-items: center;
    justify-content: space-between;
    height: ${({ hasActions }) => (hasActions ? '0' : '64px')};
    color: #555;
    padding: ${({ hasActions }) => (hasActions ? '0' : '32px')};
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
    background-color: #fff;
    z-index: 1;
`;

export const TitleHeader = styled.span`
    color: #262626;
    font-weight: 700;
    font-size: 16px;
    font-weight: 700;
`;

export const ActionsWrapper = styled.div`
    display: flex;
`;

export const BodyContainer = styled.div`
    width: 100%;
    height: 100%;
    padding: 0 32px;
    overflow: auto;
`;
