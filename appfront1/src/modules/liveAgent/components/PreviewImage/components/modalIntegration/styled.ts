import styled from 'styled-components';

const Content = styled.div`
    width: 250px;
    height: 100%;
    padding: 10px;
    background: #fff;
    border-left: 1px #e0e0e0 solid;
    overflow-y: auto;

    &::-webkit-scrollbar {
     width: 4px;
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

const Who = styled.div`
    display: flex;
    justify-content: space-between;

    span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    span:nth-child(2) {
        color: #8f8f8f;
        font-size: 13px;
        cursor: pointer;
        min-width: 25px;
        margin: 0 0 0 8px;
    }
`;

export { Content, Who }