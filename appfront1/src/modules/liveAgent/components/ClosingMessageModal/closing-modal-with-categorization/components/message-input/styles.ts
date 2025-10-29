import styled from 'styled-components';

export const Container = styled.div`
    :global {
        .ant-popover-inner-content {
            padding: 0 !important;
        }
    }
`;

export const TemplateContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 400px;
    max-height: 200px;
    overflow: hidden;
    overflow-y: auto;
`;

export const TemplateCard = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    &:hover {
        background: #f5f5f5;
    }
`;

export const TemplateTitle = styled.span`
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

export const TemplateText = styled.span`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;
