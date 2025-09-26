import styled from 'styled-components';

const Content = styled.div <{ clickable: boolean, disabled: boolean, selected: boolean }>`
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 5px;
    padding: 7px 15px;
    margin: 7px 0;    
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

    .deleteIcon {
        visibility: hidden;
    }

    :hover {
        background: #e7e7e7;

        .deleteIcon {
            visibility: visible;
        }
    }

    &:first-child {
        margin-top: 0;
    }

    .deleteIcon {
        :hover {
            color: #3768ff;
        }
    }
`;

export { 
    Content,
};