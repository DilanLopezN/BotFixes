import React, { FC, useState } from 'react'
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ModalRigthSideProps } from './props';
import { Container, BackModal, Header, Title, Body, List } from './styled';

const ModalRigthSide: FC<ModalRigthSideProps & I18nProps> = ({
    getTranslation,
    closeModal,
    children,
    title,
}) => {

    const [isClosing, setIsClosing] = useState(false);

    return (
        <Container>
            <Body className={'body' + (isClosing ? ' closing ' : '')}>
                <Header>
                    <BackModal
                        title={getTranslation('Back')}
                        onClick={() => {
                            setIsClosing(true);
                            timeout(closeModal, 300)
                        }}
                    />
                    <Title>
                        {`${getTranslation(title)}`}
                    </Title>
                </Header>
                <List>
                    {children}
                </List>
            </Body>
        </Container>
    )
}

export default i18n(ModalRigthSide) as FC<ModalRigthSideProps>;
