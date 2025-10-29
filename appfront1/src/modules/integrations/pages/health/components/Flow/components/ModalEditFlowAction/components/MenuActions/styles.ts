import styled from 'styled-components';
import { FaTags } from 'react-icons/fa';
import { IoCodeWorkingOutline } from 'react-icons/io5';
import { MdFlashOn, MdCallSplit, MdOutlineRule } from 'react-icons/md';
import { BiCommentDetail } from 'react-icons/bi';
import { FiSettings } from 'react-icons/fi';
import { Button } from 'antd';


const Tag = styled(FaTags)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const GoTo = styled(MdCallSplit)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const Atribute = styled(IoCodeWorkingOutline)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const Action = styled(MdFlashOn)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const Text = styled(BiCommentDetail)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const Rules = styled(FiSettings)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const RulesConfirmation = styled(MdOutlineRule)`
    color: #696969;
    font-size: 28px;
    cursor: pointer;
`;

const ButtonActions = styled(Button)`
    margin: 5px 6px 5px 6px;
    width: 55px;
    height: 45px;
    padding: 0; 

`;

const ContentAction = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    word-break: break-word;
    text-align: center;

    :hover {
        .actionIcon {
            color: #1890ff;
        }
        .actionButton {
            border-color: #1890ff;
        }
    }
`;

export {
    Tag,
    Atribute,
    Action,
    GoTo,
    ButtonActions,
    Text,
    Rules,
    ContentAction,
    RulesConfirmation,
}
