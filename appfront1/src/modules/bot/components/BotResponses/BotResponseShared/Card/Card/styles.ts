import styled from 'styled-components';
import { DeleteBtn } from '../../../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { Form } from 'formik';
import { AddBtn } from '../../../../../../../shared/StyledForms/AddBtn/AddBtn';
import { RiErrorWarningLine } from 'react-icons/ri';

const CardWrapper = styled('div')`
    width: 100%;
    margin: auto;
    padding: 2px;
`;
const DeleteButton = styled(DeleteBtn)`
    position: absolute;
    right: 0;
`;

const BtnTitle = styled('div')`
    white-space: pre-line;
    width: 200px;
    margin-left: 20px;
    margin-right: auto;
`;

const StyledForm = styled(Form)`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledButton = styled('div')`
    cursor: 'move';
    color: var(--color7);
    font-size: 16px;
    min-height: 32px;
    text-align: center;
    border-radius: 3px;
    margin-bottom: 3px;
    width: 100%;
    margin-right: 1px;
    padding: 2px;
`;

const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px 10px;
`;

const AddBtnContainer = styled('div')`
    display: flex;
    align-items: center;
`;

const DragAndDrop = styled('div')`
    width: 100%;
`;


const WarningButton = styled(RiErrorWarningLine)`
    font-size: 13px;
    color: #d03434;
    margin-right: 10px;
`;
export {

    WarningButton,
    DeleteButton,
    CardWrapper,
    AddBtnContainer,
    AddNewFieldBtn,
    StyledButton,
    DragAndDrop,
    BtnTitle,
    StyledForm,
};
