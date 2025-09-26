import { HiArrowRight } from 'react-icons/hi';
import { MdDelete } from 'react-icons/md';
import styled from 'styled-components';

const Content = styled.div`
    padding: 15px;
`;

const Row = styled.div`
    padding: 5px 0;
    display: flex;
    justify-content: space-between;
`;

const DeleteIcon = styled(MdDelete)`
    font-size: 18px;
    cursor: pointer;
`;

const Arrow = styled(HiArrowRight)`
    font-size: 18px;
    cursor: pointer;
`;

export { Content, Row, DeleteIcon, Arrow };
