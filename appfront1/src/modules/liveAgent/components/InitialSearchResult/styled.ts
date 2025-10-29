import styled from 'styled-components';

const TabItem = styled.div`
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    height: 36px;
    border-bottom: 2px transparent solid;
    font-weight: 600;
    color: #999;

    &.active {
        color: #444;
        border-bottom: 2px #afafaf solid;
    }
`;

export {
    TabItem
}
