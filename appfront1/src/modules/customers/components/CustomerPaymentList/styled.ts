import { BiSync } from "react-icons/bi";
import { FaPrint } from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";
import { MdDelete, MdModeEditOutline, MdPostAdd } from "react-icons/md";
import styled from "styled-components";


const TicketIcon = styled(FaPrint)`
    height: 25px;
    width: 20px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

const DownloadIcon = styled(IoMdDownload)`
    height: 25px;
    width: 20px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

const DeleteIcon = styled(MdDelete)`
    height: 25px;
    width: 20px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

const EditIcon = styled(MdModeEditOutline)`
    height: 25px;
    width: 20px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

const SyncIcon = styled(BiSync)`
    height: 25px;
    width: 20px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

const AddItemIcon = styled(MdPostAdd)`
    height: 25px;
    width: 25px;
    margin-left: 5px;
    cursor: pointer;

    :hover {
        color: #3768ff;
    }
`

export {
    TicketIcon,
    DownloadIcon,
    DeleteIcon,
    SyncIcon,
    AddItemIcon,
    EditIcon,
}