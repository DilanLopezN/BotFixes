import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { FC } from 'react';
import i18n from '../../../../../i18n/components/i18n';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { useFormik } from 'formik-latest';
import { Form } from 'formik';
import { Content, FormContainer, Scroll } from '../HealthEntityForm/styles';
import TextArea from 'antd/lib/input/TextArea';
import LabelWrapper from '../../../../../../shared-v2/LabelWraper/LabelWrapper';
import { HealthEntitySource, HealthEntityType } from 'kissbot-core';
import { HealthService } from '../../../../services/HealthService';
import { HealthEntity } from '../../../../../../model/Integrations';
import { addNotification } from '../../../../../../utils/AddNotification';
import { Button } from 'antd';

export interface HealthEntitiesFormProps {
    workspaceId: string;
    integrationId: string;
    onClose: () => any;
    entityType: HealthEntityType;
    entityList: HealthEntity[];
    setEntityList: (value) => void;
}

const HealthEntitiesForm = ({
    getTranslation,
    onClose,
    integrationId,
    workspaceId,
    entityType,
    entityList,
    setEntityList,
}: HealthEntitiesFormProps & I18nProps) => {
    const createEntity = async (entities: HealthEntity[]) => {
        const response = await HealthService.createHealthEntity(workspaceId, integrationId, entities);

        if (response) {
            addNotification({
                message: getTranslation('Entity saved'),
                title: getTranslation('Success'),
                type: 'success',
            });

            let newEntityList = [...entityList, ...response];
            setEntityList(newEntityList);
        }
    };

    const save = async (text: string) => {
        const entitiesText = text.split('\n').map((line) => line.trim());

        if (entitiesText.length) {
            const uniqueNames = new Set();

            let entities: any[] = [];

            entitiesText.forEach((entity) => {
                if (entity) {
                    let code;
                    let name;
                    const arr = entity.split('\t');
                    if (arr.length > 1) {
                        [code, name] = arr;
                    } else {
                        name = arr[0];
                    }

                    const formattedName = removeAccents(name.trim().toLocaleLowerCase());
                    if (
                        !uniqueNames.has(formattedName) &&
                        !entityList.some((entity) => removeAccents(entity.name) === removeAccents(formattedName))
                    ) {
                        uniqueNames.add(formattedName);

                        entities.push({
                            code: code || Math.random().toString(36).slice(6),
                            enableAppointment: true,
                            entityType,
                            friendlyName: name.trim(),
                            integrationId: integrationId,
                            name: name.trim(),
                            source: HealthEntitySource.user,
                            workspaceId,
                            canView: true,
                        });
                    }
                }
            });

            if (entities.length) {
                await createEntity(entities as HealthEntity[]);
            }
        }

        onClose();
    };

    const formik = useFormik({
        initialValues: { text: '' },
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    save(formik.values.text);
                }
            });
        },
    });

    const removeAccents = (text) => {
        const accentsMap = {
            a: /[áàâã]/g,
            e: /[éèê]/g,
            i: /[íìî]/g,
            o: /[óòôõ]/g,
            u: /[úùû]/g,
            c: /[ç]/g,
        };

        for (let letter in accentsMap) {
            text = text.replace(accentsMap[letter], letter);
        }

        return text;
    };

    return (
        <Form>
            <FormContainer>
                <Wrapper
                    bgcolor='#FFF'
                    height='70px'
                    flexBox
                    alignItems='center'
                    justifyContent='space-between'
                    padding='0 30px 0 15px'
                    borderBottom='1px #ddd solid'
                >
                    <Wrapper flexBox alignItems='center'>
                        <Wrapper flexBox cursor='pointer' alignItems='center'>
                            <span className='mdi mdi-24px mdi-close' onClick={onClose} />
                        </Wrapper>
                        <Wrapper padding='0 0 0 15px' fontSize='13pt'>
                            {getTranslation('Entity creation')}
                        </Wrapper>
                    </Wrapper>

                    <Wrapper flexBox alignItems='center'>
                        <Button type='primary' className='antd-span-default-color' onClick={() => formik.submitForm()}>
                            {getTranslation('Save')}
                        </Button>
                    </Wrapper>
                </Wrapper>
                <Scroll overflowX='auto' height='calc(100% - 110px)'>
                    <Content>
                        <LabelWrapper
                            title={getTranslation('Entities')}
                            subtitle={getTranslation(
                                'Paste the name of the entities to be created, or enter manually.'
                            )}
                        />
                        <TextArea
                            autoFocus
                            rows={30}
                            value={formik.values.text}
                            onChange={(event) => formik.setFieldValue('text', event.target.value)}
                        />
                    </Content>
                </Scroll>
            </FormContainer>
        </Form>
    );
};
export default i18n(HealthEntitiesForm) as FC<HealthEntitiesFormProps>;
