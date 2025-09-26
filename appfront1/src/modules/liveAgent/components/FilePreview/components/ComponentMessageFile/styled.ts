import { BiHappy } from 'react-icons/bi';
import { MdInfo } from 'react-icons/md';
import styled from 'styled-components';

const InfoIcon = styled(MdInfo)`
    font-size: 15px;
    color: #007bff;
    position: absolute;
    right: calc(26% + 2px);
    top: 50px;
`;

const EmoticonIcon = styled(BiHappy)`
    height: 20px;
    width: 20px;
    color: #666;
    position: absolute;
    cursor: pointer;
    right: 26%;
    top: 25px;
`;

export { InfoIcon, EmoticonIcon };
