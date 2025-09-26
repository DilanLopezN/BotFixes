import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-direction: column;

    svg {
        color: #fff;
        cursor: pointer;
        font-size: 25px;
    }

    span {
        color: #fff;
        font-size: 10px;
        text-align: center;
    }
`;

const WorkspaceCard = styled.div<{ selected: boolean }>`
    display: flex;
    align-items: center;
    background: #fff;
    padding: 8px 5px 8px 0;
    margin: 3px 0;
    cursor: pointer;

    svg {
        color: #284975e8;
        font-size: 22px;
        min-width: 30px;
        cursor: pointer;
        margin: 0 8px 0 0;
    }

    div {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    ${props => props.selected && `
        border-left: 3px #284975e8 solid;
    `}

    &.workspaceSelected {
        background: #e8e8e8;
    }
`;

const PopoverWrapper = styled.div`
    position: absolute;
    bottom: 10px;
    left: 70px;
    background: #fff;
    box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
    border-radius: 5px;
    max-height: 45vh;
    z-index: 9999;
`;

const WorkspaceList = styled.div`
    width: 230px;
    max-height: 40vh;
    min-height: 40vh;
    overflow-x: hidden;
    overflow-y: auto;

    &::-webkit-scrollbar {
     width: 10px;
    }
    
    &::-webkit-scrollbar-track {
        background : #E8E8E8;
        border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
        background : #999999;
        border-radius: 10px;
    }
`;

export {
    Content, PopoverWrapper, WorkspaceCard, WorkspaceList
}
