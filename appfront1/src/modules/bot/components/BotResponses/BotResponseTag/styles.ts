import styled from 'styled-components';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';

export const Main = styled('div')`
    display: flex;
`;

export const AddTextBtn = styled(AddBtn)`
    margin-left: 5px;
`;

export const DeleteElementButton = styled(DeleteBtn)`
    position: absolute;
    right: -1px;
    margin-top: 36px;
`;

export const CenterDiv = styled('div')`
    display: flex;
    justify-content: center;
    margin: 10px 0;
`;
