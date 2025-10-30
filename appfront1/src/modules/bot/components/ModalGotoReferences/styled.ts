import styled from 'styled-components';
import { MdArrowForward } from 'react-icons/md';

export const ReferencesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
    background: #fafafa;
    border-radius: 4px;
    margin-top: 16px;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #f0f0f0;
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: #bfbfbf;
        border-radius: 3px;

        &:hover {
            background: #8c8c8c;
        }
    }
`;

export const ReferenceItem = styled.div<{ isDeleted?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: ${(props) => (props.isDeleted ? '#f5f5f5' : '#fff')};
    border: 1px solid ${(props) => (props.isDeleted ? '#d9d9d9' : '#e8e8e8')};
    border-radius: 6px;
    transition: all 0.3s;
    opacity: ${(props) => (props.isDeleted ? 0.6 : 1)};

    &:hover {
        border-color: ${(props) => (props.isDeleted ? '#d9d9d9' : '#1890ff')};
        box-shadow: ${(props) => (props.isDeleted ? 'none' : '0 2px 8px rgba(24, 144, 255, 0.2)')};
    }
`;

export const InteractionName = styled.div<{ isDeleted?: boolean }>`
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => (props.isDeleted ? '#8c8c8c' : '#262626')};
    margin-bottom: 4px;
    text-decoration: ${(props) => (props.isDeleted ? 'line-through' : 'none')};
`;

export const InteractionInfo = styled.div`
    font-size: 12px;
    color: #8c8c8c;
`;

export const NavigateIcon = styled(MdArrowForward)`
    font-size: 20px;
    color: #1890ff;
    cursor: pointer;
    transition: color 0.3s;
    flex-shrink: 0;

    &:hover {
        color: #40a9ff;
    }
`;
