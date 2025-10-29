import styled from 'styled-components';

export const TextAreaSimple = styled.textarea`
    background: var(--color8);    
    border: 1px solid #d9d9d9;    
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    height: 42px;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    resize: vertical;
    ::placeholder {
      color: var(--color5);
    }

    :hover {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;
