import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #e8e8e8;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #999999;
        border-radius: 10px;
    }
`;

const TeamItem = styled.div<{ selected: boolean }>`
    display: flex;
    padding: 8px 5px;
    align-items: center;
    cursor: pointer;

    ${(props) => (props.selected ? `background: #f1f1f1` : `background: #FFF:`)}
`;

const Content = styled(Scroll)`
    display: flex;
    max-height: 280px;
    flex-direction: column;
    overflow-x: hidden;
    height: 100%;
    overflow-y: auto;
    padding: 0 10px;
    margin: 0 0 10px 0;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 10px 10px 10px;
`;

const Color = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 10px 0 0;
    height: 100%;
    width: 6px;
    border-radius: 2px;
`;

const TeamItemName = styled.div`
    ${TeamItem}:hover & {
        span {
            
            color: #333;
        }
    }
    width: 350px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

const EmptyDataInfo = styled.div`
    text-align: center;
    margin: 20px 0;
`;


export { TeamItem, TeamItemName, EmptyDataInfo, Actions, Color, Content };
