import styled from 'styled-components';

export const EditorContent = styled('div')`
    border: 1px solid #d9d9d9;
    min-height: 50px;
    padding: 10px;
    resize: vertical;
    border-radius: 5px;
    overflow: auto;
    cursor: text;
    font-size: 1rem;
    line-height: 1.5;
    background: #fff;

    :hover {
        border: 1px solid rgba(3, 102, 214, 0.6) !important;
    }
    :focus-within {
        border: 1px solid rgba(3, 102, 214, 0.6) !important;
    }
`;
