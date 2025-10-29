import styled from 'styled-components';

const Content = styled.div`
    padding: 15px 20px 0 20px;
    height: 100%;
    overflow-y: auto;
`;

const ActionsArea = styled.div`
    margin: 20px 0 0 0;
    display: flex;
    justify-content: space-between;
`;

const VariablesArea = styled.div`
    margin: 15px 0;
    max-height: 300px;
`;

const VariableItem = styled.div`
    display: flex;
    align-items: center;
`;

const VariableLabel = styled.div`
    display: flex;
`;

const InfoArea = styled.div`
    display: flex;
    margin: 0 0 15px 0;
    font-weight: bold;
`;

const PreviewArea = styled.div`
    display: flex;
    margin: 10px 0 10px 0;
    border-left: 2px #007bff solid;
    padding: 0 0 10px 13px;
`;

const Line = styled.div`
    border-top: 1px #dedede solid;
    margin: 0 30px;
`;


export {
    Content,
    ActionsArea,
    VariablesArea,
    VariableItem,
    VariableLabel,
    InfoArea,
    PreviewArea,
    Line,
}