import React, { FC } from 'react'
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DiscardBtn } from '../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import styled from 'styled-components';

interface DeleteEntityModalProps {
    onDelete: () => any;
    onClose: () => any;
}

const Wrap = styled('div')`
    width: 100%;
    padding: 20px;
`;

const OptionsWrap = styled('div')`
    display: flex;
    justify-content: space-around;
`;

const CustomDiscardBtn = styled(DiscardBtn)`
    min-width: 100px;
`;

const CustomDoneBtn = styled(DoneBtn)`
    min-width: 100px;
    background-color: #dc3545;
`;

const DeleteEntityModal = ({ getTranslation, onDelete, onClose }: DeleteEntityModalProps & I18nProps) => {
    return <Wrap>
        <p>{getTranslation('Are you sure you want to delete health entity')}</p>
        <OptionsWrap>
            <CustomDiscardBtn onClick={onClose}>
                {getTranslation('No')}
            </CustomDiscardBtn>
            <CustomDoneBtn onClick={onDelete}>
                {getTranslation('Yes')}
            </CustomDoneBtn>
        </OptionsWrap>
    </Wrap>
}

export default i18n(DeleteEntityModal) as FC<DeleteEntityModalProps>;
