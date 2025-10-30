import { Button } from 'antd';
import { Form, Formik } from 'formik';
import { Component } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';
import { FormProps } from '../../../../../interfaces/FormProps';
import { FormikErrorMessage } from '../../../../../shared/StyledForms/FormikErrorMessage/FormikErrorMessage';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../../i18n/components/i18n';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';

const CreateRow = styled.div`
    display: flex;
    align-items: stretch;
    margin-bottom: 12px;
    width: 100%;
`;

interface FormNewContainerProps extends FormProps, I18nProps {}

class FormNewContainerClass extends Component<FormNewContainerProps> {
    getValidationSchema = () => {
        return Yup.object().shape({
            name: Yup.string().required('Required'),
        });
    };

    render() {
        const { getTranslation } = this.props;

        return (
            <Formik
                initialValues={{ name: '', type: 'container' }}
                onSubmit={this.props.onSubmit}
                validationSchema={this.getValidationSchema()}
                render={({ submitCount }) => (
                    <Form>
                        <LabelWrapper label={getTranslation('New container')}>
                            <CreateRow>
                                <StyledFormikField
                                    className='form-control form-control-sm'
                                    type='text'
                                    name='name'
                                    placeholder={getTranslation('Interaction name')}
                                    autoFocus={true}
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

export const FormNewContainer = I18n(FormNewContainerClass);
