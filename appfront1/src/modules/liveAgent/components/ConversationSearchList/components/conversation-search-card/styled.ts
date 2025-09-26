import { BiCodeCurly } from 'react-icons/bi';
import { HiOutlineUser } from 'react-icons/hi';
import styled from 'styled-components';

const Card = styled.div<{ statusBorderColor: string; selected: boolean }>`
    cursor: pointer;
    padding: 6px 8px;
    margin: 0 0 0 1px;
    border-bottom: 1px solid #f0f0f0;
    border-left: 4px solid transparent;

    ${(props) =>
        props.statusBorderColor &&
        `
        border-left: 4px solid ${props.statusBorderColor} !important;
    `}

    &:hover {
        background: #dcdcdc80;
    }

    ${(props) =>
        props.selected &&
        `
        background: #dcdcdc80;
    `}
`;

const CreatedChannel = styled.div`
    border-radius: 50%;
    padding: 2px;
    box-shadow: rgba(71, 88, 114, 0.08) 0px 2px 2px;
    width: 17px;
    height: 17px;

    img {
        width: 15px;
        height: 15px;
    }
`;

const ContactIcon = styled(HiOutlineUser)`
    font-size: 13px;
`;

const AttributeIcon = styled(BiCodeCurly)`
    font-size: 13px;
`;

const Tag = styled.div`
    height: 6px;
    width: 25px;
    margin: 0 8px 0 0;
    border-radius: 4px;
`;

const TagsWrapper = styled.div`
    margin: 8px 0 0 0;
    display: flex;
`;

export { Card, CreatedChannel, ContactIcon, AttributeIcon, Tag, TagsWrapper };
