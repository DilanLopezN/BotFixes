import styled from 'styled-components'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

const Row = styled.div`
    padding: 9px 10px;
    align-items: center;
    justify-content: space-between;
    display: flex;
`;

const ColUser = styled(Wrapper)`
    display: flex;
    align-items: center;
    width: 60%;
`;

export {
    ColUser,
    Row
}