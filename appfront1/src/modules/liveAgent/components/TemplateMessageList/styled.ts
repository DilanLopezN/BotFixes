import { FiFile } from 'react-icons/fi';
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        height: 5px;
        width: 5px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;

const TemplateItem = styled(Wrapper)<{ size: number }>`
    &:hover {
        background: #dcdcdc2e;
    }

    cursor: pointer;
    height: ${(props) => props.size}px;
    padding: 10px 12px 10px 12px;
    display: flex;
    justify-content: space-between;
    border-radius: 5px;
    margin: 0 3px 0 0;
    flex-direction: row;
    align-items: flex-start;
    border-bottom: 1px #f4eeee solid;
`;

const EmptyImage = styled.img`
    height: 85px;
`;

const IconFile = styled(FiFile)`
    font-size: 13px;
    margin: 0 auto;
    color: #696969;
    cursor: pointer;
`;

export { EmptyImage, TemplateItem, Scroll, IconFile };
