import styled from 'styled-components';
import { Field } from 'formik';

export const FieldCustomFormik = styled(Field)`
    background: var(--color8);    
    border: 1px solid #d9d9d9;    
    color: var(--color7);
    padding: 9px !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 36px;
    max-height: none;
    border-radius: 3px !important;
    width: 100%;
    ::placeholder {
      color: var(--color1);
    }

    :hover {
      border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
      border: 1px solid rgba(3, 102, 214, 0.6);
      box-shadow: rgba(3, 102, 214, 0.3) 0px 0px 0px 0px !important;
    }
`;
