import { MdDeleteOutline, MdRepeat } from 'react-icons/md';
import styled from 'styled-components';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';

export const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px auto;
`;

export const DeleteIcon = styled(MdDeleteOutline)`
    font-size: 18px;
    margin: 10px 0 0 8px;
    cursor: pointer;

    &:hover {
        color: #007bff;
    }
`;

export const StyledChangeInputBtn = styled(MdRepeat)`
    margin: 10px 0;
    position: absolute;
    right: 7px;
    top: 22px;
    height: 17px;
    width: 18px;
    cursor: pointer;

    :hover {
        color: #007bff;
    }
`;
