import React, { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import styled from 'styled-components';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface SendDocumentButtonProps {
    onClick: () => void;
    loading?: boolean;
}

const IconTag = styled.span <{ margin?: string }>`
  ${props => props.margin && `
    ::before {
      margin: ${props.margin}
    }
  `}
  font-size: 27px;
  cursor: pointer;
`;

const SendDocumentButton: FC<SendDocumentButtonProps & I18nProps> = ({
    onClick,
    getTranslation,
    loading = false,
}) => {
    return (
        <Wrapper
            alignItems='center'
            margin='0 0 0 18px'
            flexBox>
            <IconTag
                className={loading ? "mdi mdi-loading mdi-spin" : "mdi mdi-upload"}
                onClick={loading ? undefined : onClick}
                title={getTranslation('Send Attachment to Appointment')}
                style={{
                    cursor: loading ? 'wait' : 'pointer'
                }}
            />
        </Wrapper>
    );
};

export default i18n(SendDocumentButton) as FC<SendDocumentButtonProps>;