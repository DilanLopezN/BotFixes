import React, { FC, useState } from 'react'
import { Wrapper, PrimaryButton } from '../../../../ui-kissbot-v2/common'
import { BotAttributeEditProps } from './props'
import I18n from '../../../i18n/components/i18n'
import { Formik, Form } from 'formik'
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper'
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField'
import * as Yup from 'yup';
import { ColorType } from '../../../../ui-kissbot-v2/theme'

const BotAttributeEdit: FC<BotAttributeEditProps> = (props) => {

  const {
    botAttribute,
    getTranslation,
    onCancel,
    onSave,
    onDelete,
    openInteraction,
    addNotification
  } = props;

  const getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
      label: Yup.string().required('This field is required'),
    });
  };

  const canDeleteBot = () => {
    if (botAttribute.interactions && botAttribute.interactions.length === 0) {
      return onDelete(botAttribute)
    }

    return addNotification({
      type: 'warning',
      duration: 5000,
      title: getTranslation('Error'),
      message: getTranslation('It is not possible to remove an attribute in use')
    })
  }

  return <Wrapper
    padding='15px'
  >
    <Wrapper
      fontSize='18px'
      fontWeight='600'
      color='#666'
      margin='0 0 12px 0'
      truncate
    >
      {botAttribute.name}
    </Wrapper>

    <Wrapper
      margin='15px 0 2px 0'>
      <Formik
        initialValues={{ ...botAttribute }}
        onSubmit={(values) => onSave(values)}
        render={({ submitForm, touched, errors, submitCount }) => {
          return <Form>
            <LabelWrapper validate={{
              touched, errors,
              isSubmitted: submitCount >= 1,
              fieldName: `label`
            }} label={getTranslation('Label')}>
              <StyledFormikField
                name={`label`}
                placeholder={getTranslation('Label')} />
            </LabelWrapper>

            <Wrapper
              margin='20px 0 0 0 '
              flexBox
              justifyContent='space-between'
            >
              <PrimaryButton
                colorType={ColorType.danger}
                onClick={() => canDeleteBot()}
              >
                {getTranslation('Delete')}
              </PrimaryButton>

              <Wrapper
                flexBox
                justifyContent='flex-end'
              >
                <PrimaryButton
                  outline
                  margin='0 15px'
                  onClick={onCancel}
                >
                  {getTranslation('Cancel')}
                </PrimaryButton>

                <PrimaryButton
                  onClick={() => submitForm()}
                >
                  {getTranslation('Save')}
                </PrimaryButton>
              </Wrapper>
            </Wrapper>
          </Form>
        }} />
      <Wrapper>
        {botAttribute.interactions && botAttribute.interactions.length > 0
          && <>
            <Wrapper
              fontWeight='600'
              borderTop='1px #ddd solid'
              padding='20px 0 0 0 '
              margin='10px 0 6px 0'>
              {`${getTranslation('This attribute is being used in the following interactions')}:`}
            </Wrapper>
            <Wrapper
              margin='0 0 8px 0'
              fontSize='13px'
              color='#888'>
              {`(${getTranslation('Click to view')})`}
            </Wrapper>

            {botAttribute.interactions && botAttribute.interactions.map((e: string, index) => {
              return <Wrapper
                key={e}
                onClick={() => openInteraction(e)}>
                <Wrapper
                  cursor='pointer'
                  margin='7px 0'>
                  {`${getTranslation('Interaction')} ${index + 1}`}
                </Wrapper>
              </Wrapper>
            })}
          </>}
      </Wrapper>
    </Wrapper>
  </Wrapper>
}

export default I18n(BotAttributeEdit)
