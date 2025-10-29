import { FC, useState } from 'react'
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { CustomerFormWrapperProps } from './props';
import * as Yup from 'yup';
import { useFormik } from 'formik-latest';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { DiscardBtn } from '../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../shared/StyledForms/DoneBtn/DoneBtn';
import orderBy from 'lodash/orderBy';
import { Customer } from '../../page/Customers/interfaces';
import { CustomersService } from '../../service/BillingService';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import CustomerForm from '../CustomerForm';

const emptyCustomer = {
    legalName: '',
    registrationId: '',
    taxRegistrationType: '',
    state: '',
    postalCode: '',
    phoneNumber: '',
    ibge: '',
    districtOrCounty: '',
    countryCode: '55',
    company: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
}


const CustomerFormWrapper: FC<CustomerFormWrapperProps & I18nProps> = ({
    getTranslation,
    onCancel,
    addNotification,
    customer
}) => {
    const [withError, setWithError] = useState<any>(undefined);
    const [modalChangeOpen, setModalChangeOpen] = useState(false)
    const [currentCustomer, setCurrentCustomer] = useState<Customer>(customer || emptyCustomer)
    const [formDisabled, setFormDisabled] = useState(customer ? true : false)

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            legalName: Yup.string().required("This field is required"),
            registrationId: Yup.string().required("This field is required"),
            // taxRegistrationType: Yup.string().required("This field is required"),
            state: Yup.string().required("This field is required"),
            postalCode: Yup.string().required("This field is required"),
            phoneNumber: Yup.string().required("This field is required"),
            ibge: Yup.string().required("This field is required"),
            districtOrCounty: Yup.string().required("This field is required"),
            countryCode: Yup.string().required("This field is required"),
            company: Yup.string().required("This field is required"),
            city: Yup.string().required("This field is required"),
            addressLine1: Yup.string().required("This field is required"),
            addressLine2: Yup.string().required("This field is required"),
            addressLine3: Yup.string(),
            email: Yup.string().email(),
            website: Yup.string().url().nullable(),
            vinculeToWorkspaceIds: Yup.array().of(Yup.string()),
        });
    };

    const formik = useFormik({
        enableReinitialize: customer ? true : false,
        validationSchema: getValidationSchema(),
        initialValues: { ...currentCustomer },
        onSubmit: () => {
            formik.setSubmitting(true)
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    save(formik.values)

                    if (!withError) {
                        formik.resetForm();
                    }
                }
            })
        }
    })

    const save = (values) => {

        if (!customer) {
            return createAccount(values)
        }
        updateAccount(values)
    }

    const createAccount = async (values) => {
        const createAccount = await CustomersService.createCustomerAccount(values, (err: any) => {
            setWithError(err);
        })

        if (!withError && createAccount) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Account successfully created')
            })

            return onCancel()

        }
    }

    const updateAccount = async (values) => {
        if (!customer?.id) return;

        await CustomersService.updateCustomerAccount(customer.id, values, (err: any) => {
            setWithError(err);
        })

        if (!withError) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Account successfully updated')
            })

            return onCancel()

        }
    }

    const cancelEdit = (values) => {
        if (!values.id) {
            return onCancel()
        }

        let newValues: any = {}
        let newCustomer: any = {}
        orderBy(Object.keys(values)).map(value => {
            newValues[value] = values[value]
        })

        if (!customer) return onCancel();

        orderBy(Object.keys(customer)).map(value => {
            newCustomer[value] = customer[value]
        })

        if (JSON.stringify(newCustomer) === JSON.stringify(newValues)) {

            onCancel();
        } else {

            setCurrentCustomer(values)
            return setModalChangeOpen(true)
        }
    }

    const getCnpj = async (value) => {
        const originalValue = value
        value = value.replace(/\D/g, "")

        if (value.length === 14) {
            const responseAsaas = await CustomersService.getCNPJAsaas(value)

            let ibge 
            try{
                ibge = await getCep(responseAsaas?.postalCode, true)
            } catch(e){}

            return formik.setValues({
                ...formik.values,
                registrationId: originalValue,
                legalName: responseAsaas.legalName,
                addressLine1: responseAsaas.addressLine1,
                postalCode: responseAsaas.postalCode,
                addressLine2: responseAsaas.addressLine2,
                addressLine3: responseAsaas.addressLine3,
                city: responseAsaas.city,
                company: responseAsaas.company,
                districtOrCounty: responseAsaas.districtOrCounty,
                email: responseAsaas.email,
                phoneNumber: responseAsaas.phoneNumber,
                state: responseAsaas.state,
                gatewayClientId: responseAsaas?.gatewayClientId || '',
                ibge: ibge || '',
            })

        }
    }

    const getCep = async (value, ibge?) => {
        const originalValue = value
        value = value.replace(/\D/g, "")

        if (value.length === 8) {
            const cep = Number(value)
            const response = await CustomersService.getCep(cep)

            if (!response.data) return

            if (response.data.erro) {
                return addNotification({
                    title: getTranslation('Error'),
                    message: getTranslation('Postal code invalid'),
                    type: 'warning',
                    duration: 3000
                })
            }

            if (ibge) {
                return response.data.ibge
            }

            return formik.setValues({
                ...formik.values,
                postalCode: originalValue,
                addressLine1: response.data.logradouro,
                city: response.data.localidade,
                districtOrCounty: response.data.bairro,
                state: response.data.uf,
                ibge: response.data.ibge
            })
        }
    }

    return <>
        <div className="ModalContainer">
            <Modal height="150px" width="390px" isOpened={modalChangeOpen}
                position={ModalPosition.center}>
                <div className="modal-change-close">
                    <h5>{getTranslation('Unsaved changes')}</h5>
                    <p>{getTranslation('You have unsaved changes. Are you sure you want to leave')}
                        <span> {getTranslation('without saving')}?</span></p>
                    <div className="modal-change">
                        <DiscardBtn onClick={() => setModalChangeOpen(false)}
                            className="modal-confirm-no">
                            {getTranslation('No')}
                        </DiscardBtn>
                        <DoneBtn onClick={() => {
                            onCancel();
                            setModalChangeOpen(false)
                        }} className="modal-confirm-yes">
                            {getTranslation('Yes')}
                        </DoneBtn>
                    </div>
                </div>
            </Modal>
        </div>
        
        <form style={{ minWidth: '800px', margin: '0 auto', width: '70%' }}>
            <Wrapper
                flexBox
                justifyContent='space-between'
                margin='30px 0 20px 0'
            >
                <PrimaryButton colorType={ColorType.text} onClick={() => cancelEdit(formik.values)}>{getTranslation('Cancel')}</PrimaryButton>
                {
                    !formDisabled ?
                        <PrimaryButton onClick={() => formik.submitForm()}>{getTranslation('Save')}</PrimaryButton>
                        :
                        <PrimaryButton onClick={() => setFormDisabled(false)}>{getTranslation('Edit')}</PrimaryButton>
                }
            </Wrapper>

            <CustomerForm
                formik={formik}
                formDisabled={formDisabled}
                getCep={(value) => getCep(value)}
                getCnpj={(value) => getCnpj(value)}
            />
        </form>
    </>
}

export default i18n(CustomerFormWrapper) as FC<CustomerFormWrapperProps>
