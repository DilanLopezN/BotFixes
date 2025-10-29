import { FC } from 'react'
import styled from 'styled-components';
import { FlowTagCardProps } from './props'
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common'
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../../i18n/components/i18n'
import InputColor from '../../../../../../../../../../shared/StyledForms/InputColor';
import { InputSimple } from '../../../../../../../../../../shared/InputSample/InputSimple';
import MenuLeftActions from '../MenuLeftActions';
import { SimpleSelect } from '../../../../../../../../../../shared/SimpleSelect/SimpleSelect';



const FlowTagCard: FC<FlowTagCardProps> = ({
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
  const actionsTag: any[] = values

  return <Wrapper margin='0 0 -50px 0'>
    <Wrapper
      fontSize='16px'
      margin='10px 45px -60px'
      width='90%'>
      {getTranslation('Tag')}
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
      <div style={{ display: 'flex' }}>
        <Wrapper width='60%'>
          <LabelWrapper
            label={getTranslation('Action')}
            validate={{
              touched, errors,
              isSubmitted: isSubmitted,
              fieldName: "action"
            }}>
            <SimpleSelect onChange={event => {
              event.preventDefault()
              setFieldValue(`actions[${index}].element.action`, event.target.value)
            }
            } value={actionsTag[index].element.action}>
              <option value={'add'}>
                {getTranslation('add')}
              </option>
              <option value={'remove'}>
                {getTranslation('remove')}
              </option>
              <option value={'remove-all'}>
                {getTranslation('remove all')}
              </option>
            </SimpleSelect>
          </LabelWrapper>
        </Wrapper>
        {actionsTag[index].element.action
          === 'add'
          &&
          <Wrapper
            width='40%' margin='0 0 0 10px'>
            <LabelWrapper
              validate={{
                touched, errors,
                isSubmitted: isSubmitted,
                fieldName: `color`
              }}
              label={getTranslation('Color')}>
              <div>
                <InputColor
                  name={`color`}
                  value={actionsTag[index].element.color}
                  onChange={(color) => {
                    const colorful = `#${color}`
                    actionsTag[index].element.color = colorful
                    setFieldValue(`actions[${index}].element.color`, colorful)
                  }
                  }
                />
              </div>
            </LabelWrapper>
          </Wrapper>
        }
      </div>

      {actionsTag[index].element.action
        !== 'remove-all'
        && <LabelWrapper
          label={'Nome'}
          validate={{
            touched, errors,
            isSubmitted: isSubmitted,
            fieldName: "name"
          }}
        >
          <InputSimple
            style={{ borderColor: '#000 !important' }}
            value={actionsTag[index].element.name}
            placeholder={getTranslation('Name')}
            onChange={(value) => {
              setFieldValue(`actions[${index}].element.name`, value.target.value)
            }
            } />
          {validation[index] === false && actionsTag[index].element.name === '' &&
            <div style={{ color: 'red', fontSize: '12px' }}>{getTranslation('This field is required')}</div>
          }
        </LabelWrapper>}
    </Wrapper>
  </Wrapper>
}

export default I18n(FlowTagCard);
