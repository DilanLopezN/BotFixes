import { BiCheckCircle } from 'react-icons/bi';
import { HiOutlineExclamation } from 'react-icons/hi';
import { MdSync } from 'react-icons/md';
import { MdUpdate } from 'react-icons/md';
import { RiErrorWarningLine } from 'react-icons/ri';
import styled from 'styled-components';

const SyncButton = styled(MdSync)<{ $infinity?: boolean }>`
    ${(props) =>
        props.$infinity &&
        `
        @keyframes rotation {
            from {
                -webkit-transform: rotate(0deg);
            }
            to {
                -webkit-transform: rotate(359deg);
            }
        }

        animation: rotation 1s infinite linear;
   `};
    font-size: 26px;
    color: #3286e0;
`;

const SuccessButton = styled(BiCheckCircle)`
    font-size: 26px;
    color: #1da741;
    margin-left: 4px;
`;

const IconPendingPublication = styled(MdUpdate)`
    font-size: 26px;
    color: #ec6f34;
    cursor: pointer;
`;

const IconPendingPublicationEntitiesFlow = styled(HiOutlineExclamation)`
    font-size: 26px;
    margin-top: 3px;
    color: #ec6f34;
`;

const WarningButton = styled(RiErrorWarningLine)`
    font-size: 26px;
    cursor: pointer;
    color: #d03434;
    margin-left: 4px;
`;

export { SyncButton, SuccessButton, IconPendingPublication, WarningButton, IconPendingPublicationEntitiesFlow };
