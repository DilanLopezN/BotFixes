import React, { Component } from 'react'
import { BotResponseRecognizerScopeProps } from './BotResponseRecognizerScopeProps';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../utils/Sentry';

class BotResponseRecognizerScopeClass extends Component<BotResponseRecognizerScopeProps> {
  private getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
      value: Yup.string()
        .required("This field is required")
    });
  };
  recognizerScopeTypes = ['root', 'subsequent'];

  onChange = (values, isValid: boolean) => {
    const response = this.props.response;
    response.elements = [Object.assign(values)];
    response.isResponseValid = isValid;
    this.props.onChange(response);
  };

  render() {
    const { elements } = this.props.response;
    const { getTranslation } = this.props;

    return <Formik
      isInitialValid={true}
      initialValues={{
        value: elements && elements[0]
          ? elements[0].value == '' ? '' : elements[0].value : ''
      }}
      onSubmit={() => { }}
      validationSchema={this.getValidationSchema()}
      render={({ values, submitForm, validateForm, touched, errors }) => {
        const submit = () => {
          validateForm().then((validatedValues: any) => {
            if (validatedValues.isCanceled) {
              submit();
              return;
            }

            if (Object.keys(validatedValues).length != 0) {
              this.onChange(values, false);
            } else {
              this.onChange(values, true);
            }
            submitForm();
          }).catch(e => dispatchSentryError(e))
        };

        return <Form>
          <LabelWrapper
            label={getTranslation('Scope')}
            validate={{
              touched, errors,
              fieldName: "value",
              isSubmitted: this.props.submitted
            }}
            tooltip={`${getTranslation('Define conversation scope')}.`}
          >
            <StyledFormikField name="value"
              component="select" onBlur={() => submit()}
              style={{ width: "100%" }}>
              <option value=''>{getTranslation('Select scope')}</option>
              {this.recognizerScopeTypes.map(element =>
                <option value={element} key={element}>{element}</option>
              )}
            </StyledFormikField>
          </LabelWrapper>
        </Form>
      }}
    />
  }
}

export const BotResponseRecognizerScope = I18n(BotResponseRecognizerScopeClass);