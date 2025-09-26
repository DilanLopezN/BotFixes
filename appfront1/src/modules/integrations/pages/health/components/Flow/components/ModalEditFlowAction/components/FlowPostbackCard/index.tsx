import { FC } from 'react'
import { FlowPostbackCardProps } from './props'
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common'
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../../i18n/components/i18n'
import { InputSimple } from '../../../../../../../../../../shared/InputSample/InputSimple';
import MenuLeftActions from '../MenuLeftActions';

const FlowPostbackCard: FC<FlowPostbackCardProps> = ({
  touched,
  errors,
  isSubmitted,
  setFieldValue,
  getTranslation,
  values,
  index,
  onDeleteAction,
  validation,
}) => {
  const actionsTrigger: any[] = values;

  return <Wrapper margin='0 0 -50px 0'>
    <Wrapper
      fontSize='16px'
      margin='10px 45px -60px'
      width='90%'>
      {getTranslation('Postback')}
    </Wrapper>
    <MenuLeftActions 
      values={values}
      index={index}
      onchange={(actions) => setFieldValue(`actions`, actions)}
      onDeleteAction={onDeleteAction}
    />
    <Wrapper
      position='relative'
      top='-65px'
      margin='15px 20px 15px 45px'
      width='90%'
      padding='15px'
      borderRadius='5px'
      border='1px #e2e2e2 solid'
      bgcolor='#f7f7f7'
      borderBottom='1px #ddd solid'>
      <LabelWrapper
        label={getTranslation('Value')}
        validate={{
          touched, errors,
          isSubmitted: isSubmitted,
          fieldName: "value"
        }}
      >
        <InputSimple value={actionsTrigger[index].element.value} placeholder={getTranslation('Value')} onChange={(value) => {
          setFieldValue(`actions[${index}].element.value`, value.target.value)
        }
        } />
        {validation[index] === false && actionsTrigger[index].element.value === '' &&
          <div style={{ color: 'red', fontSize: '12px' }}>{getTranslation('This field is required')}</div>
        }
      </LabelWrapper>
    </Wrapper>
  </Wrapper>
}

export default I18n(FlowPostbackCard);
