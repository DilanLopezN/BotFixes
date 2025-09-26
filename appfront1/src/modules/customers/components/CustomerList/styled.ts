import { Select as Antdselect, Input } from 'antd';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

export const Select = styled(Antdselect)`
    width: 200px;
`;

export const InputSearch = styled(Input.Search)`
    width: 200px;
`;

export const Redirect = styled(Wrapper)`
    cursor: pointer;

    :hover {
        text-decoration: underline;
        color: #255fff;
    }
`;

export const NoteIcon = styled(FaFileInvoiceDollar)`
    height: 20px;
    width: 20px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`;
