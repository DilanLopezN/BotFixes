import { FC, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { ContactEditProps } from './props';
import { Wrapper, PrimaryButton, UserAvatar } from '../../../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { FieldCustomFormik } from '../../../../../../shared/StyledForms/FieldCustomFormik';
import { ColorType } from '../../../../../../ui-kissbot-v2/theme';
import I18n from '../../../../../i18n/components/i18n';
import { ContactService } from '../../../../service/Contact.service';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import { useSelector } from 'react-redux';

const ContactEdit: FC<ContactEditProps> = ({ contact, onCreate, onCancel, getTranslation, workspaceId }) => {
    const [submitted, setSubmitted] = useState(false);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    
    if(!contact.ddi) contact.ddi = '55'

    if(contact.phone?.startsWith(contact?.ddi || '55')){
        contact.phone = contact.phone.slice(contact.ddi.length);
    }

    const phoneRegExp =
        /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
    const getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().required('This field is required'),
            phone: Yup.string().matches(phoneRegExp, 'Phone number is not valid'),
        });
    };

    const updateContact = async (values) => {
        const updated = await ContactService.updateContact(values, workspaceId);
        if (updated) {
            onCreate(updated);
        }
    };

    return (
        <Formik
            initialValues={{ ...contact }}
            onSubmit={() => {}}
            enableReinitialize={true}
            validationSchema={getValidationSchema()}
            render={({ values, submitForm, validateForm, touched, errors, setFieldValue }) => {
                const submit = () => {
                    setSubmitted(true);
                    validateForm().then((validatedValues: any) => {
                        if (validatedValues.isCanceled) return submit();
                        submitForm();

                        if (Object.keys(validatedValues).length === 0) updateContact(values);
                    });
                };
                
                return (
                    <Form>
                        <Wrapper flexBox margin='10px 0' justifyContent='center'>
                            <UserAvatar
                                size={50}
                                hashColor={contact._id}
                                user={{
                                    avatar: contact.avatar,
                                    name: contact.name,
                                }}
                            />
                        </Wrapper>
                        <div style={{ wordWrap: 'break-word', fontSize:'16px', margin:'3px 0', justifyContent:'center', display:'flex'}}>
                            <b>{contact.name}</b>
                        </div>
                        {contact.phone ? (
                            <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                                {`+${contact.ddi + contact.phone}`}
                            </Wrapper>
                        ) : null}
                        {contact.email ? (
                            <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                                {contact.email}
                            </Wrapper>
                        ) : null}
                        <Wrapper>
                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: submitted,
                                    fieldName: `name`,
                                }}
                                label={getTranslation('Name')}
                            >
                                <FieldCustomFormik
                                    className='form-control form-control-sm'
                                    name='name'
                                    autoFocus
                                    placeholder={getTranslation('Name')}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: submitted,
                                    fieldName: `email`,
                                }}
                                label={getTranslation('Email (Optional)')}
                            >
                                <FieldCustomFormik
                                    className='form-control form-control-sm'
                                    name='email'
                                    placeholder='Email'
                                />
                            </LabelWrapper>
                            {isAnySystemAdmin(loggedUser) ? (
                                <>
                                    <LabelWrapper
                                        validate={{
                                            touched,
                                            errors,
                                            isSubmitted: submitted,
                                            fieldName: `ddi`,
                                        }}
                                        label={getTranslation('DDI')}
                                    >
                                        <FieldCustomFormik
                                            className='form-control form-control-sm'
                                            name='ddi'
                                            placeholder='55'
                                            onChange={(ev: any) => {
                                                if(/^\d+$/.test(ev.target.value)){
                                                    setFieldValue(
                                                        `ddi`,
                                                        ev.target.value
                                                    );
                                                }
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        validate={{
                                            touched: true,
                                            errors: {...errors},
                                            isSubmitted: true,
                                            fieldName: `phone`,
                                        }}
                                        label={getTranslation('Phone')}
                                    >
                                        <FieldCustomFormik
                                            className='form-control form-control-sm'
                                            name='phone'
                                            placeholder='phone'
                                            onChange={(ev: any) => {
                                                if(phoneRegExp.test(ev.target.value)){
                                                    setFieldValue(
                                                        `phone`,
                                                        ev.target.value
                                                    );
                                                }
                                            }}
                                        />
                                    </LabelWrapper>
                                    <Wrapper padding='10px 5px'>
                                        <strong>Atenção:</strong> Alterar o número de telefone do contato pode causar a perda do histórico de conversas associado ao número atual.
                                    </Wrapper>
                                </>
                            ): null}
                        </Wrapper>
                        
                        

                        <Wrapper flexBox margin='15px 0' justifyContent='space-between'>
                            <PrimaryButton width='70px' colorType={ColorType.text} onClick={onCancel}>
                                {getTranslation('Cancel')}
                            </PrimaryButton>
                            <PrimaryButton width='70px' onClick={submit}>
                                {getTranslation('Save')}
                            </PrimaryButton>
                        </Wrapper>
                    </Form>
                );
            }}
        />
    );
};

export default I18n(ContactEdit);
