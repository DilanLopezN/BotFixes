import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Header = styled(Wrapper)`
    padding: 10px 15px;
    background-color: #fff;
    display: flex;
    border-right: 1px solid #f0f0f0;
    z-index: 2;
    position: relative;
    align-items: center;
    &.disabled {
        pointer-events: none;
        opacity: 0.7;
    }
`;
const StyledCheckboxContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;
export { Header, StyledCheckboxContainer };
