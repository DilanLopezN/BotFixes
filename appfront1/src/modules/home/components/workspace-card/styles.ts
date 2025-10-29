import styled from 'styled-components';

const Content = styled.div <{ clickable: boolean, disabled: boolean, selected: boolean }>`
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 5px;
    padding: 12px 15px;
    margin: 5px 0;    
    justify-content: space-between;

    ${props => props.selected && `
        border-left: 5px solid #3b5981;
    `}

    ${props => props.clickable && `
        cursor: pointer;
    `}
    
    ${props => props.disabled && `
        opacity: 1;
    `}
`;

const WorkspaceActions = styled.div <{ clickable: boolean }>`
    svg {
        color: #284975e8;
        font-size: 25px;
        ${props => props.clickable && `
             cursor: pointer;

             &:hover {
                opacity: 0.8;
            }
        `}
        
        &:not(:last-child) {
            margin: 0 15px 0 0;
        }
    }
`;

const WorkspaceInfo = styled.div`
    display: flex;
    align-items: center;

    svg {
        color: #284975e8;
        font-size: 30px;
        margin: 0 15px 0 0;
    }
`;

export { Content, WorkspaceInfo, WorkspaceActions };
