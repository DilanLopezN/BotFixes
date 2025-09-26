import { FaLock, FaLockOpen } from "react-icons/fa";
import styled from "styled-components";

const LockClosedIcon = styled(FaLock)`
    position: absolute;
    top: 0;
    left: 10px;
    cursor: pointer;
    font-size: 15px;

    :hover {
        color: #595959;
    }
`;

const LockOpenIcon = styled(FaLockOpen)`
    position: absolute;
    top: 0;
    left: 10px;
    cursor: pointer;
    font-size: 15px;

    :hover {
        color: #595959;
    }
`;

export { LockClosedIcon, LockOpenIcon };