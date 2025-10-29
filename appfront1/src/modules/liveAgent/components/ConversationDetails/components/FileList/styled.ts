import { IoIosArrowForward } from 'react-icons/io';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { MdFileDownload } from 'react-icons/md';

const Miniature = styled(Wrapper) <{ attachmentUrl: string }>`
    background-image: url(${({ attachmentUrl }) => attachmentUrl});
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    cursor: pointer;
    transition: all 500ms;
    overflow: hidden;

    &:hover {
        transform: scale(1.05);
    }
`;

const ModalFilesIcon = styled(IoIosArrowForward)`
    font-size: 15px;
    margin-right: 10px;
    cursor: pointer;
    color: #797979;
`;

const DownloadAllFiles = styled.div`
    display: flex;
    align-items: center;
    margin-top: 6px;
    cursor: pointer;

    :hover {
        color: #1890ff;
    }
`;

const DownloadIcon = styled(MdFileDownload)`
    margin-right: 5px;
    font-size: 19px;
`

export {
    Miniature,
    ModalFilesIcon,
    DownloadAllFiles,
    DownloadIcon,
}
