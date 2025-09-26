import { FC } from 'react';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Button, Input, Modal, Select } from 'antd';
import { PaymentItemFormProps } from './props';
import { PaymentItem, PaymentItemTypes } from '../../../../interfaces/payment-item.interface';
import { useFormik } from 'formik-latest';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomersService } from '../../../../service/BillingService';
import { addNotification } from '../../../../../../utils/AddNotification';

export const initialFormPaymentItem: PaymentItem = {
    itemDescription: '',
    paymentId: 0,
    workspaceId: '',
    quantity: 1,
    type: PaymentItemTypes.extra,
    unitPrice: 0,
    totalPrice: 0,
};

const PaymentItemForm: FC<PaymentItemFormProps & I18nProps> = ({ getTranslation, cancel, onClose, paymentItem }) => {
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: paymentItem || initialFormPaymentItem,
        onSubmit: (values) => save(values),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const { value: inputValue } = e.target;
        const reg = /^-?\d*(\.\d*)?$/;
        if (reg.test(inputValue) || inputValue === '' || inputValue === '-') {
            formik.setFieldValue(field, inputValue);
        }
    };

    const createPaymentItem = async () => {
        const { paymentId, workspaceId } = formik.values;
        if (!workspaceId || !paymentId) {
            return;
        }
        let error;
        await CustomersService.createPaymentItem(
            workspaceId,
            paymentId,
            {
                itemDescription: formik.values.itemDescription,
                paymentId,
                quantity: formik.values.quantity,
                type: formik.values.type,
                unitPrice: formik.values.unitPrice,
            },
            (erro) => {
                error = erro;
            }
        );

        if (!error) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Item criado com sucesso!'),
            });
            onClose();
            return;
        }

        addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao criar item, tente novamente!'),
        });
    };

    const updatePaymentItem = async () => {
        const { paymentId, workspaceId } = formik.values;
        if (!workspaceId || !paymentId) {
            return;
        }
        let error;
        await CustomersService.updatePaymentItem(
            workspaceId,
            paymentId,
            formik.values.id!,
            {
                itemDescription: formik.values.itemDescription,
                quantity: formik.values.quantity,
                unitPrice: formik.values.unitPrice,
            },
            (erro) => {
                error = erro;
            }
        );

        if (!error) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Item atualizado com sucesso!'),
            });
            onClose();
            return;
        }

        addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao atualizar item, tente novamente!'),
        });
    };

    const save = (values) => {
        if (values?.id) {
            return updatePaymentItem();
        }
        createPaymentItem();
    };

    return (
        <Modal
            title={getTranslation(formik.values?.id ? 'Atualizar item da cobrança' : 'Cadastro de item na cobrança')}
            open={!!paymentItem}
            footer={
                <div>
                    <Button type='default' className='antd-span-default-color' onClick={cancel}>
                        {getTranslation('Cancel')}
                    </Button>
                    <Button className='antd-span-default-color' type='primary' onClick={formik.submitForm}>
                        {getTranslation('Save')}
                    </Button>
                </div>
            }
            onCancel={cancel}
            bodyStyle={{ padding: '15px' }}
            centered
            destroyOnClose
            width='700px'
        >
            <form>
                <LabelWrapper label={getTranslation('Descrição')}>
                    <Input
                        maxLength={150}
                        value={formik.values.itemDescription}
                        onChange={(e) => {
                            const value = e.target.value || '';
                            formik.setFieldValue('itemDescription', value);
                        }}
                    />
                </LabelWrapper>
                {
                    !formik.values?.id && (
                <LabelWrapper label={getTranslation('Tipo do item da cobrança')}>
                    <Select
                        style={{width: '100%'}}
                        value={formik.values.type}
                        onChange={(value) => {
                            formik.setFieldValue('type', value);
                        }}
                        options={[
                            { label: 'Extra', value: PaymentItemTypes.extra },
                            { label: 'Desconto', value: PaymentItemTypes.discount },
                        ]}
                    />
                </LabelWrapper>
                    )
                }
                <LabelWrapper label={getTranslation('Valor por unidade')}>
                    <Input
                        value={formik.values.unitPrice}
                        onChange={(e) => handleChange(e, 'unitPrice')}
                        type='number'
                    />
                </LabelWrapper>
                <LabelWrapper label={getTranslation('Quantidade')}>
                    <Input
                        min={1}
                        value={formik.values.quantity}
                        onChange={(e) => handleChange(e, 'quantity')}
                        type='number'
                    />
                </LabelWrapper>
                <LabelWrapper label={getTranslation('Total')}>
                    <Input disabled value={formik.values.quantity * formik.values.unitPrice} />
                </LabelWrapper>
            </form>
        </Modal>
    );
};

export default i18n(PaymentItemForm) as FC<PaymentItemFormProps>;
