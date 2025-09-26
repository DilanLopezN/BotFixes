import { BsFillInfoCircleFill } from 'react-icons/bs';
import styled from 'styled-components';
import { InfoIconProps } from './interfaces';

export const HelpIcon = styled(BsFillInfoCircleFill)<InfoIconProps>`
    font-size: ${(props) => (props.color === 'primary' ? '12px' : '9px')};
    margin-left: 5px;
    margin-bottom: 3px;
    color: ${(props) => (props.color === 'primary' ? '#4b84da' : '#bdbdbd')};
    background: #fff;
`;
