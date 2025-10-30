import { Button } from 'antd';
import { Form, Formik } from 'formik';
import React, { Component } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';
import { FormProps } from '../../../../../interfaces/FormProps';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { FormikErrorMessage } from '../../../../../shared/StyledForms/FormikErrorMessage/FormikErrorMessage';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../../i18n/components/i18n';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';

const CreateRow = styled.div`
    display: flex;
    align-items: stretch;
    margin-bottom: 12px;
    width: 100%;
`;

interface FormNewInteractionProps extends FormProps, I18nProps {}

class FormNewInteractionClass extends Component<FormNewInteractionProps> {
    getValidationSchema = () => {
        return Yup.object().shape({
            name: Yup.string().required('Required'),
        });
    };

    render() {
        const { getTranslation } = this.props;

        return (
            <Formik
                initialValues={{ name: '' }}
                onSubmit={this.props.onSubmit}
                validationSchema={this.getValidationSchema()}
                render={({ submitCount }) => (
                    <Form>
                        <LabelWrapper label={getTranslation('New interaction')}>
                            <CreateRow>
                                <StyledFormikField
                                    className='create-input'
                                    type='text'
                                    name='name'
                                    placeholder={getTranslation('Interaction name')}
                                    autoFocus
                                />
                                <Button
                                    type='default'
                                    size='large'
                                    htmlType='submit'
                                    className='antd-span-default-color'
                                    icon={<span className='mdi mdi-chevron-right' />}
                                />
                            </CreateRow>
                            <FormikErrorMessage name='name' isSubmitted={submitCount > 0} />
                        </LabelWrapper>
                    </Form>
                )}
            />
        );
    }
}

export const FormNewInteraction = I18n(FormNewInteractionClass);
