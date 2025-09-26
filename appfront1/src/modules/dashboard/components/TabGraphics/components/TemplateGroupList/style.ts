import { GrLock, GrUnlock } from 'react-icons/gr';
import { HiDotsVertical } from 'react-icons/hi';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

const CardTemplateGroup = styled(Wrapper)`
    width: 180px;
    cursor: pointer;
    font-size: 13px;
`;

const WrapperName = styled(Wrapper)<{selected: boolean}>`
    width: 150px;
    margin: 0 5px;
    font-size: 15px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    color: ${(props) => props.selected ? '#40a9ff': '#696969'};
`;
  
const PublicIcon = styled(GrUnlock)`
    font-size: 13px;
    margin-right: 5px;
`

const PrivateIcon = styled(GrLock)`
    font-size: 13px;
    margin-right: 5px;
`;

const OptionsCol = styled('div')`
    display: flex;
    justify-content: center;
    font-weight: bold;
    align-items: center;
    width: 30px;
`;

const OptionsIcon = styled(HiDotsVertical)`
    color: #777;
    font-size: 17px;
    cursor: pointer;

    &:hover {
        color: #444;
    };
`;

const Content = styled('div')`
    .modal-change {
        font-size: 14px;
    };
`;

export {
    CardTemplateGroup,
    PublicIcon,
    PrivateIcon,
    WrapperName,
    OptionsCol,
    OptionsIcon,
    Content,
};
