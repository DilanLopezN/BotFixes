import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Wrapped = styled(Wrapper)`
    p {
        color: #888;
    }
`;

const Balloon = styled(Wrapper)<any>`
    min-width: 90px;
    display: flex;
    justify-content: space-between;
    position: relative;
    flex-direction: column;
    border-radius: 0.4em;
    font-size: 13px;
    padding: 5px 7px 8px 9px;
    max-width: 50vw;
    color: #888;
    background: #fef1b6;
    margin-right: 15px;

    &:after {
        content: '';
        position: absolute;
        top: 20px;
        width: 0;
        height: 0;
        border: 7px solid transparent;
        margin-top: -7px;
        border-left-color: #fef1b6;
        border-right: 0;
        right: 0;
        margin-right: -7px;
    }
`;

const SendNote = styled(Wrapper)`
    display: flex;
    align-items: center;
    column-gap: 4px;
`;

export { Wrapped, Balloon, SendNote };
