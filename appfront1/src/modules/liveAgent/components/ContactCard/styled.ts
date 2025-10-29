import { FaLock } from 'react-icons/fa';
import styled from 'styled-components';

const Card = styled.div`
    background: #fff;
    position: relative;
    padding: 0;
    display: flex;
    cursor: pointer;
    &:hover {
        background: #f7f7f7;
    }
`;

const LockIcon = styled(FaLock)`
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    font-size: 15px;
`;

export { Card, LockIcon };
