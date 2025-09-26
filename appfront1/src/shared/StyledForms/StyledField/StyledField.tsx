import styled from 'styled-components';

export const StyledInput = styled('input')`
    background: var(--color8);    
    border: 1px solid #e4e9f0 !important;    
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 42px;
    max-height: none;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    ::placeholder {
       color: var(--color1) !important;
    }
`
