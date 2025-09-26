import styled from 'styled-components';
import { Button, Table } from 'antd';
import { MdCancel, MdDone, MdEdit, MdDelete } from 'react-icons/md';
import { IoMdFlash } from 'react-icons/io';
import { HiDotsVertical } from 'react-icons/hi';
import { AiFillCaretDown } from 'react-icons/ai';

const Content = styled.div``;

const CustomTable = styled(Table)`
    table {
        tr,
        td {
            background: #fff;
            padding: 10px 5px !important;
        }

        td {
            font-size: 14px;
        }

        th {
            padding: 14px 10px !important;
        }

        .ant-table-measure-row {
            display: none;
        }

    }
    
    .inactiveFlow > .ant-table-cell:first-child {
        border-left: 3px solid #555 !important;
    }
`;

const EditIcon = styled(MdEdit)`
    color: #777;
    font-size: 17px;
    cursor: pointer;

    &:hover {
        color: #444;
    }
`;

const SaveIcon = styled(MdDone)`
    color: #777;
    font-size: 19px;
    cursor: pointer;
    margin: 0 0 0 2px;

    &:hover {
        color: #444;
    }
`;

const ActionsIcon = styled(IoMdFlash)`
    color: #777;
    font-size: 19px;
    cursor: pointer;
    margin: 0 0 0 2px;

    &:hover {
        color: #007bff;
    }
`;

const CancelIcon = styled(MdCancel)`
    color: #777;
    font-size: 18px;
    cursor: pointer;

    &:hover {
        color: #444;
    }
`;

const DeleteIcon = styled(MdDelete)`
    color: #777;
    font-size: 17px;
    cursor: pointer;
    margin: 0 0 0 2px;

    &:hover {
        color: #444;
    }
`;

const OptionsIcon = styled(HiDotsVertical)`
    color: #777;
    font-size: 17px;
    cursor: pointer;
    margin: 0 0 0 2px;

    &:hover {
        color: #444;
    }
`;

const ButtonStyled = styled(Button)<any>`
    span {
        ${(props) => (!props.color ? `color: #fff;` : `color: #696969;`)}
    }
`;

const SortIcon = styled(AiFillCaretDown)<any>`
    font-size: 12px;
    cursor: pointer;
    ${(props) => (!props.active ? `color: #bfbfbf;` : `color: #1890ff;`)}
`;

export {
    Content,
    CustomTable,
    EditIcon,
    ActionsIcon,
    SaveIcon,
    CancelIcon,
    DeleteIcon,
    OptionsIcon,
    ButtonStyled,
    SortIcon,
};
