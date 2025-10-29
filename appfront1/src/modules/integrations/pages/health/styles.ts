import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

const StyledNavLink = styled(NavLink)`
    color: #696969;
    &:hover {
        color: #1890ff;
    }
    &:focus,
    &:active {
        outline: none;
        color: #696969;
    }
    &.active {
        color: #1890ff;
    }
`;

export { StyledNavLink };
