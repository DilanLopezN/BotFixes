import { AiOutlineBarChart } from 'react-icons/ai';
import { BiLineChart } from 'react-icons/bi';
import { BsGlobe2 } from 'react-icons/bs';
import { GrLock } from 'react-icons/gr';
import { FaTrash } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import { RiPieChart2Line } from 'react-icons/ri';
import { VscTable } from 'react-icons/vsc';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

const WrapperFormStyle = styled(Wrapper)`
    border: 1px solid #e8e8e8;
    border-radius: 3px;
    background: #fff;
    margin-bottom: 30px;
`;

const TitleStyle = styled(Wrapper)`
    font-size: 15px;
    font-weight: bold;
    border-bottom: 1px solid #e8e8e8;
    padding: 5px 10px;
`

const BodyStyle = styled(Wrapper)`
    padding: 15px;
`

const AddCondition = styled(Wrapper)`
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px 0;
    cursor: pointer;
`

const GraphicTypeStyle = styled(Wrapper)`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 5px 0;
    cursor: pointer;

    :hover {
        background: #E6F7FF;
    }

    &.selectedType {
        background: #E6F7FF;
    }
`

const GraphicBar = styled(AiOutlineBarChart)`
    width: 25px;
    height: 25px;
    margin: 5px 0 5px 20px;
`

const GraphicLine = styled(BiLineChart)`
    width: 25px;
    height: 25px;
    margin: 5px 0 5px 20px;
`

const GraphicTable = styled(VscTable)`
    width: 25px;
    height: 25px;
    margin: 5px 0 5px 20px;
`

const GraphicPie = styled(RiPieChart2Line)`
    width: 25px;
    height: 25px;
    margin: 5px 0 5px 20px;
`

const CloseDrawer = styled(IoIosArrowBack)`
    margin-right: 35px;
    width: 20px;
    height: 20px;
    cursor: pointer;

    :hover {
        color: rgba(0, 0, 0, 0.75);
    }
`

const DividerAnd = styled('div')`
    width: 60px;
    height: 23px;
    position: absolute;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    left: 135px;
    top: -10px;
    background: #fff;
`

const Line = styled('div')`
    position: relative;
    border-bottom: 1px solid #e8e8e8;
    margin: 20px -15px 10px -15px;
`

const DeleteIcon = styled(FaTrash)`
    font-size: 11px;
    cursor: pointer;

    :hover {
        color: #1890ff;
    }
`
  
const PublicIcon = styled(BsGlobe2)`
    font-size: 15px;
    color: #696969;
    margin-right: 8px;
`

const PrivateIcon = styled(GrLock)`
    font-size: 15px;
    color: #696969;
    margin-right: 8px;
`

export {
    WrapperFormStyle,
    TitleStyle,
    BodyStyle,
    AddCondition,
    GraphicTypeStyle,
    GraphicBar,
    GraphicLine,
    GraphicTable,
    GraphicPie,
    CloseDrawer,
    DividerAnd,
    Line,
    DeleteIcon,
    PublicIcon,
    PrivateIcon,
};
