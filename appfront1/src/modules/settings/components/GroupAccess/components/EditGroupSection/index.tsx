import { FC, useEffect } from 'react'
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper'
import i18n from '../../../../../i18n/components/i18n'
import { I18nProps } from '../../../../../i18n/interface/i18n.interface'
import { EditGroupSectionProps } from './props'
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common'
import styled from 'styled-components'
import { AddBtn } from '../../../../../../shared/StyledForms/AddBtn/AddBtn';
import { DeleteBtn } from '../../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { InputSimple } from '../../../../../../shared/InputSample/InputSimple';
import { Form } from 'formik';

const TextFieldWrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`

const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px auto;
    
`

const StyledDeleteBtn = styled(DeleteBtn)`
    margin: 10px 0;
    position: absolute;
    right: 0;
   `


const EditGroupSection: FC<EditGroupSectionProps & I18nProps> = ({
    getTranslation,
    group,
    onChange,
    formik,
    submitted,
}) => {

    useEffect(() => {
        if (JSON.stringify(group) !== JSON.stringify(formik.values))
            onChange({ ...group, ...formik.values })
    }, [formik.values])

    return (
        <Form
            style={{
                margin: '10px 10px 0'
            }}>
                <Card header={getTranslation('Group access')}>
                    <Wrapper
                        width='100%'
                        display='flex'
                        flexDirection='column'>
                        <LabelWrapper validate={{
                            touched: formik.touched, errors: formik.errors,
                            isSubmitted: submitted,
                            fieldName: `name`
                        }} label={getTranslation('Name')}>
                            <InputSimple
                                placeholder={getTranslation('Name')}
                                value={formik.values.name}
                                onChange={(ev: any) => {
                                    formik.setFieldValue('name', ev.target.value);
                                }}
                            />
                        </LabelWrapper>
                        <Wrapper flexBox>
                            <LabelWrapper validate={{
                                touched: formik.touched, errors: formik.errors,
                                isSubmitted: submitted,
                                fieldName: `accessSettings.ipListData`
                            }} tooltip={'ex: 190.168.1.1/28'} label={getTranslation('IP list')}>
                                <Wrapper overflowY='auto'>
                                    {formik.values.accessSettings.ipListData.map((value: string, index: number) => {
                                        return <TextFieldWrapper key={`${index}`}>

                                            <InputSimple value={value} onChange={(data) => {
                                                const texts = formik.values.accessSettings.ipListData;
                                                texts[index] = data.target.value;
                                                formik.setValues({ ...formik.values, accessSettings: { userList: [...formik.values.accessSettings.userList], ipListData: [...texts] } })
                                            }} />

                                            {formik.values.accessSettings.ipListData.length > 1 ? <StyledDeleteBtn onClick={() => {
                                                formik.values.accessSettings.ipListData.splice(index, 1);
                                                formik.setFieldValue('accessSettings.ipListData', formik.values.accessSettings.ipListData)
                                            }} /> : null}
                                            {formik.values.accessSettings.ipListData.length - 1 == index
                                                ? <AddNewFieldBtn onClick={() => {
                                                    formik.values.accessSettings.ipListData.push('');
                                                    formik.setFieldValue('accessSettings.ipListData', formik.values.accessSettings.ipListData)
                                                }} />
                                                : null
                                            }
                                        </TextFieldWrapper>
                                    })
                                    }
                                </Wrapper>
                            </LabelWrapper>
                        </Wrapper>
                    </Wrapper>
                </Card>
        </Form>
    )
}

export default i18n(EditGroupSection) as FC<EditGroupSectionProps>
