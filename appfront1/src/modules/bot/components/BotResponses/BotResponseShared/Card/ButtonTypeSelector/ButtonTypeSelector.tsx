import React from 'react';
import styled from 'styled-components';
import { ResponseButtonType } from 'kissbot-core';
import { FaMagnet, FaPhone, FaShare, FaShareAlt } from 'react-icons/fa';

const ButtonTypeSelector = styled('div')`
    display: flex;
    justify-content: space-between;
    margin: 20px 10px;
`;

const ButtonTypeSelectorBtn = styled('div')`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    cursor: pointer;
    &.selected {
        color: var(--color3);
    }
`;
export const ButtonSelector = ({ type, onChange }) => {
    return (
        <ButtonTypeSelector>
            <ButtonTypeSelectorBtn
                onClick={() => onChange(ResponseButtonType.goto)}
                className={type == ResponseButtonType.goto ? 'selected' : undefined}
            >
                <FaShare style={{ marginRight: '4px' }} /> GoTo
            </ButtonTypeSelectorBtn>
            <ButtonTypeSelectorBtn
                className={type == ResponseButtonType.url ? 'selected' : undefined}
                onClick={() => onChange(ResponseButtonType.url)}
            >
                <FaMagnet style={{ marginRight: '4px' }} /> URL
            </ButtonTypeSelectorBtn>
            <ButtonTypeSelectorBtn
                className={type == ResponseButtonType.postback ? 'selected' : undefined}
                onClick={() => onChange(ResponseButtonType.postback)}
            >
                <FaShareAlt style={{ marginRight: '4px' }} /> Postback
            </ButtonTypeSelectorBtn>
            <ButtonTypeSelectorBtn
                className={type == ResponseButtonType.phone ? 'selected' : undefined}
                onClick={() => onChange(ResponseButtonType.phone)}
            >
                <FaPhone style={{ marginRight: '4px' }} /> Phone
            </ButtonTypeSelectorBtn>
        </ButtonTypeSelector>
    );
};
