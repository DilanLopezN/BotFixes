import { Button } from 'antd';
import { Form, Formik } from 'formik';
import { Component } from 'react';
import styled from 'styled-components';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../../i18n/components/i18n';
import { FormNewInteractionReferenceProps } from './FormNewInteractionReferenceProps';

const ReferenceRow = styled.div`
    display: flex;
    align-items: stretch;
    margin-top: 12px;
    width: 100%;

    .reference-select {
        flex: 1 1 auto;
        min-width: 0;

        .ant-select-selector {
            display: flex;
            align-items: center;
        }

        .ant-select-selection-item,
        .ant-select-selection-placeholder {
            flex: 1 1 auto;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .ant-btn {
        flex: 0 0 auto;
    }
`;

class FormNewInteractionReferenceClass extends Component<FormNewInteractionReferenceProps, any> {
    private getFilteredInteractionList = (): Array<Interaction> => {
        return this.props.interactionList.filter((interaction: Interaction) => {
            return (
                interaction._id !== this.props.interaction._id &&
                interaction.type !== InteractionType.welcome &&
                interaction.type !== InteractionType.fallback &&
                interaction.type !== InteractionType.container &&
                interaction.type !== InteractionType.contextFallback
            );
        });
    };

    render() {
        const { getTranslation } = this.props;

        const filteredInteraction = this.getFilteredInteractionList();
        return (
            <Formik
                initialValues={{ reference: filteredInteraction.length > 0 ? filteredInteraction[0]._id : '' }}
                onSubmit={this.props.onSubmit}
                render={() => (
                    <Form>
                        <LabelWrapper label={getTranslation('Select a interaction to reference')}>
                            <ReferenceRow>
                                <StyledFormikField component='select' name='reference' className='reference-select'>
                                    {filteredInteraction.map((interaction: Interaction, index: number) => {
                                        return (
                                            <option value={interaction._id} key={index}>
                                                {interaction.name}
                                            </option>
                                        );
                                    })}
                                </StyledFormikField>
                                <Button
                                    type='default'
                                    size='large'
                                    htmlType='submit'
                                    icon={<span className='mdi mdi-chevron-right' />}
                                    className='antd-span-default-color'
                                />
                            </ReferenceRow>
                        </LabelWrapper>
                    </Form>
                )}
            />
        );
    }
}

export const FormNewInteractionReference = I18n(FormNewInteractionReferenceClass);
