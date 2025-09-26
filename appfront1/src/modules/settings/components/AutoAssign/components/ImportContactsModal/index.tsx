import { Input, Space, Alert, Button, Row, Col } from 'antd';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { ImportContactsModalProps } from './props';
import { useState } from 'react';
import { Modal } from '../../../../../../shared/Modal/Modal';
import { BoxModal } from './styled';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { ContactAutoAssign } from '../../../../interfaces/auto-assign-conversation.interface';

const { TextArea } = Input;

const phoneNumberUtil = PhoneNumberUtil.getInstance();
const delimiter = /[,;]/;

const ImportContactsModal = (props: ImportContactsModalProps) => {
    const { isModalOpen, setIsModalOpen, form, getTranslation, workspaceId } = props;

    const [pasteText, setPasteText] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handlePasteModal = () => {
        const lines = pasteText.split('\n');
        let hasError = false;
        const newContacts = lines
            .map((line) => {
                if (!line.includes(',') && !line.includes(';')) {
                    setErrorMessage(
                        'Error: Invalid format. Please separate name and phone number with a comma or semicolon'
                    );
                    hasError = true;
                    return null;
                }
                const [name, phoneNumber] = line.split(delimiter);

                try {
                    const parsedPhoneNumber = phoneNumberUtil.parse(phoneNumber, 'BR');
                    if (!phoneNumberUtil.isValidNumber(parsedPhoneNumber)) {
                        setErrorMessage('Error: One of the numbers provided is invalid to be a phone number');
                        hasError = true;
                        return null;
                    }
                    const formattedPhoneNumber = phoneNumberUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164);
                    return { name, phone: formattedPhoneNumber, workspaceId };
                } catch (error) {
                    setErrorMessage(
                        getTranslation(
                            'Sorry, but the number you entered is already being used for automatic assignment.'
                        )
                    );
                    hasError = true;
                    return null;
                }
            })
            .filter((contact) => contact !== null);

        const existingContacts = form.values.contacts;
        const filteredContacts = newContacts.filter((contact) => {
            const isExisting = existingContacts.some((contactAutoAssign: ContactAutoAssign) => {
                const cleanPhone1 = contactAutoAssign.phone.replace('+', '');
                const cleanPhone2 = contact?.phone.replace('+', '');
                return cleanPhone1 === cleanPhone2;
            });
            if (isExisting) {
                setErrorMessage(
                    getTranslation('Sorry, but the number you entered is already being used for automatic assignment.')
                );
                hasError = true;
            }
            return !isExisting;
        });
        if (!hasError) {
            form.setFieldValue('contacts', [...existingContacts, ...filteredContacts]);
            setPasteText('');
            setIsModalOpen(false);
        }
    };

    const alertMessage = (
        <Space direction='vertical' style={{ width: '100%', marginBottom: '14px' }}>
            <Alert type='error' message={getTranslation(errorMessage)} showIcon />
        </Space>
    );

    return (
        <Modal width='600px' isOpened={isModalOpen}>
            <BoxModal>
                <h5>{getTranslation('Import several')}</h5>

                <Row>
                    {errorMessage && alertMessage}
                    <LabelWrapper
                        label={getTranslation(
                            'Paste here the contacts to be added or enter manually in the format: (name;phone)'
                        )}
                    >
                        <TextArea
                            rows={12}
                            placeholder='João da silva;5548998774457'
                            value={pasteText}
                            onChange={(e) => {
                                setPasteText(e.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row>
                <Row justify={'end'} style={{ paddingTop: '14px' }}>
                    <Space direction='horizontal' size='middle'>
                        <Col>
                            <Button className='antd-span-default-color' onClick={() => setIsModalOpen(false)}>
                                {getTranslation('Cancel')}
                            </Button>
                        </Col>
                        <Col>
                            <Button className='antd-span-default-color' onClick={handlePasteModal} type='primary'>
                                {getTranslation('Add')}
                            </Button>
                        </Col>
                    </Space>
                </Row>
            </BoxModal>
        </Modal>
    );
};

export default ImportContactsModal;
