import { FC } from 'react';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import I18n from '../../../../../i18n/components/i18n';
import { Modal, ModalProps } from 'antd';
import styled from 'styled-components';
import { BsChatText, BsWhatsapp } from 'react-icons/bs';

const Card = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 10px;
    width: 350px;
    height: 195px;
    margin: 0 15px;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 8px;
    border-radius: 5px;

    span {
        font-weight: bold;
        font-size: 15px;
        margin-bottom: 5px;
    }

    p {
        word-break: break-word;
        text-align: center;
    }

    &:hover {
        background: #8bc9fb4c;
    }
`;

const WhatsIcon = styled(BsWhatsapp)`
    width: 30px;
    height: 30px;
    color: #25D366;
    margin-bottom: 7px;
`;

const MessageIcon = styled(BsChatText)`
    width: 30px;
    height: 30px;
    color: #097cb6;
    margin-bottom: 7px;
`;

const ModalStyled = styled(Modal)`
    .ant-modal-content {
        border-radius: 5px;
    }

    .ant-modal-header {
        border-radius: 5px 5px 0 0;
    }
`;

interface Props extends ModalProps {
    handleTemplateCreation: (value: boolean) => void;
}

const ModalSelectTypeTemplate: FC<Props & I18nProps> = (props) => {
    const { getTranslation, handleTemplateCreation } = props;
    return (
        <ModalStyled width={600} bodyStyle={{ display: 'flex', padding: '25px 15px' }} {...props}>
            <>
                <Card onClick={() => handleTemplateCreation(false)}>
                    <div>
                        <MessageIcon />
                    </div>
                    <span>{getTranslation('Unofficial template')}</span>
                    <p>{getTranslation('Unofficial template that assists in sending prompt messages in customer service.')}</p>
                </Card>
                <Card onClick={() => handleTemplateCreation(true)}>
                    <div>
                        <WhatsIcon />
                    </div>
                    <span>{getTranslation('Official template')}</span>
                    <p>{getTranslation('Official template, requires approval by Whatsapp so that it can be used to create new appointments or start a new session.')}</p>
                </Card>
            </>
        </ModalStyled>
    );
};

export default I18n(ModalSelectTypeTemplate) as FC<Props>;
