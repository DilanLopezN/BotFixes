import styled from 'styled-components';
import { Field } from 'formik';

export const StyledFieldSmallCustomSearch = styled(Field)`
    background: var(--color8);    
    border: 1px solid #d9d9d9;    
    color: var(--color7);
    padding: 5px 12px 5px 12px !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 38px;
    max-height: none;
    border-radius: 4px !important;
    outline: none;
    width: 100%;
    ::placeholder {
      color:var(--color5);
    }

    :hover {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;
