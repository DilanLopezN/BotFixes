import React, { FC, useMemo } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import I18n from '../../modules/i18n/components/i18n';
import { useLanguageContext } from '../../modules/i18n/context';
import { LabelWrapper } from '../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { LabelWrapperInteractionProps } from './interfaces';

interface StyledIconProps {
    href: string;
}

export const IconGotoInteraction = styled.a<StyledIconProps>`
    color: #696969;

    :hover {
        color: #1890ff !important;
    }
`;

export const ErrorMessage = styled.div`
    width: 100%;
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
    padding-left: 2px;
`;

export const LabelWrapperInteraction: FC<LabelWrapperInteractionProps> = ({
    label,
    validate,
    tooltip,
    interaction,
    children,
    selectedWorkspace,
    currentBot,
    interactionList,
}) => {
    const { getTranslation } = useLanguageContext();

    const isInvalidReference = useMemo(() => {
        const fieldName = validate?.fieldName;
        if (!interaction) return false;
        if (fieldName === 'selectedInteraction') return false;

        // Obter placeholder do input filho
        const inputPlaceholder = (() => {
            const child = React.Children.toArray(children).find(
                (child) => React.isValidElement(child) && child.props?.placeholder
            );
            return React.isValidElement(child) ? child.props.placeholder : '';
        })();

        // Não validar workspace para campos que podem aceitar qualquer valor
        const fieldsWithoutWorkspaceValidation = [
            'url',
            'cta',
            'telefone',
            'phone',
            'ctaText',
            'ctaUrl',
            'Postback',
            'Escolha uma trigger',
        ];

        // Verificar se o fieldName ou placeholder contém alguma das palavras-chave (case insensitive)
        const shouldSkipValidation = fieldsWithoutWorkspaceValidation.some((field) => {
            const fieldLower = field.toLowerCase();
            const fieldNameLower = (fieldName || '').toLowerCase();
            const placeholderLower = inputPlaceholder.toLowerCase();

            return fieldNameLower.includes(fieldLower) || placeholderLower.includes(fieldLower);
        });

        if (shouldSkipValidation) {
            return false;
        }

        // Se o interaction não é um ID válido (contém :// ou outros caracteres de URL), não validar
        if (
            interaction &&
            (interaction.includes('://') || interaction.includes('tel:') || interaction.includes('mailto:'))
        ) {
            return false;
        }

        return !interactionList?.some((item: { _id: string }) => item._id === interaction);
    }, [validate?.fieldName, interaction, interactionList, children]);

    return (
        <>
            <LabelWrapper
                label={
                    <>
                        {label}
                        {interaction && currentBot && selectedWorkspace && (
                            <IconGotoInteraction
                                title={getTranslation('Navigate to the selected interaction')}
                                className='mdi mdi-share mdi-18px'
                                href={`/workspace/${selectedWorkspace._id}/bot/${currentBot._id}/interaction/${interaction}`}
                                target='_blank'
                            />
                        )}
                    </>
                }
                validate={validate}
                tooltip={tooltip}
            >
                {React.cloneElement(children, { interaction })}
                {isInvalidReference && (
                    <ErrorMessage>
                        {getTranslation('Selection of an existing interaction in this workspace is required')}
                    </ErrorMessage>
                )}
            </LabelWrapper>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    currentBot: state.botReducer.currentBot,
    interactionList: state.botReducer.interactionList,
});

export const FormItemInteraction = I18n(withRouter(connect(mapStateToProps, {})(LabelWrapperInteraction)));
