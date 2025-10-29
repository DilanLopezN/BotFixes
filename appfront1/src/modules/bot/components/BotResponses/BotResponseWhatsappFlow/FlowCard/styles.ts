import styled from 'styled-components';
import { Form } from 'formik';

const CardWrapper = styled('div')`
    width: 100%;
    margin: auto;
    padding: 2px;
`;
const StyledForm = styled(Form)`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export {
    CardWrapper,
    StyledForm,
};
