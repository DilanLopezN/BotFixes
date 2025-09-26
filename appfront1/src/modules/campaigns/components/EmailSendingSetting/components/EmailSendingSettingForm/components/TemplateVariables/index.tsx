import { FC } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import { Col, Divider, Input, Row, Skeleton, Typography } from 'antd';
import { EmailSendingSetting } from '../../../../../../service/EmailSendingSettingService/interface';
import { FormikProps } from 'formik-latest';

interface TemplateEmailVariablesProps {
    loading: boolean;
    formik: FormikProps<EmailSendingSetting>;
    template: any;
}

const TemplateEmailVariables: FC<TemplateEmailVariablesProps & I18nProps> = (props) => {
    const { getTranslation, loading, formik, template } = props;

    const getContentMessage = () => {
        if (!formik.values.templateId) {
            return <Typography.Text type={'danger'}>{getTranslation('Selecione um template!')}</Typography.Text>;
        }

        if (!formik.values.versionId) {
            return (
                <Typography.Text type={'danger'}>{getTranslation('Selecione uma versão do template!')}</Typography.Text>
            );
        }

        if (!template) {
            return <Typography.Text>{getTranslation('Template não foi encontrado!')}</Typography.Text>;
        }

        const templateVersion = template?.versions?.find((version) => version.id === formik.values.versionId);

        const templateVariables = [];
        const content = templateVersion?.plain_content as string;

        if (content) {
            // Encontra todos os {{...}}
            const matches = content.match(/{{(.*?)}}/g) || [];

            matches.forEach((match) => {
                const cleanMatch = match.replace(/[{}]/g, '').trim();

                // Filtra apenas variáveis, excluindo:
                // - Condicionais: #if, /if, else
                // - Loops: #each, /each
                // - Comentários que começam com !
                // - Helpers que começam com #
                if (
                    !cleanMatch.startsWith('#') && // Remove helpers (#if, #each, etc)
                    !cleanMatch.startsWith('/') && // Remove fechamentos (/if, /each, etc)
                    !cleanMatch.startsWith('!') && // Remove comentários
                    cleanMatch !== 'else' && // Remove else
                    !cleanMatch.includes('..') && // Remove referências de contexto (..)
                    !cleanMatch.startsWith('@') && // Remove variáveis de contexto (@index)
                    !cleanMatch.startsWith('this.') // Remove variáveis que começam com this.
                ) {
                    // Adiciona apenas se não estiver já na lista
                    if (!templateVariables.includes(cleanMatch as never)) {
                        templateVariables.push(cleanMatch as never);
                    }
                }
            });
        }

        if (!templateVariables.length) {
            return (
                <Typography.Text>
                    {getTranslation('Não existem variáveis a serem preenchidas para este template!')}
                </Typography.Text>
            );
        }

        return (
            <div style={{ width: '100%' }}>
                {templateVariables.map((variable) => {
                    return (
                        <Row style={{ alignItems: 'center', marginBottom: '10px' }}>
                            <Typography.Title level={5}>{`{{${variable}}}:`}</Typography.Title>
                            <Input
                                maxLength={1000}
                                value={formik.values?.templateVariables?.[variable]}
                                placeholder={getTranslation('Preencha o valor da variavel')}
                                onChange={(event) => {
                                    let newVariables: any = {
                                        ...formik.values.templateVariables,
                                        [variable]: event.target.value,
                                    };
                                    if (!event.target.value) {
                                        delete newVariables[variable];
                                    }

                                    if (!Object.keys(newVariables)?.length) {
                                        newVariables = undefined;
                                    }
                                    formik.setFieldValue('templateVariables', newVariables);
                                }}
                            />
                        </Row>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <Divider
                children={getTranslation('Variáveis do template (Preencha as variáveis específicas para o envio)')}
                orientation='left'
                orientationMargin={20}
                style={{ fontSize: 14, fontWeight: 'bold' }}
            />
            {loading ? <Skeleton /> : <Row>{getContentMessage()}</Row>}
        </>
    );
};

export default i18n(TemplateEmailVariables) as FC<TemplateEmailVariablesProps>;
