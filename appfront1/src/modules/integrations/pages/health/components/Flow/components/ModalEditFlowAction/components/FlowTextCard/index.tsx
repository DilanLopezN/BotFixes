import { FC } from 'react'
import { FlowTextCardProps } from './props'
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common'
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../../i18n/components/i18n'
import TextAreaAutoSize from '../../../../../../../../../../shared/TextAreaAutoSize/TextAreaAutoSize';
import MenuLeftActions from '../MenuLeftActions';

const FlowTextCard: FC<FlowTextCardProps> = ({
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
    const actionsText: any[] = values;

    const size = () => {
        
        return (actionsText[index].element.text.match(new RegExp('\n' , "g")) || []).length
    }

    return <Wrapper margin='0 0 -50px 0'>
        <Wrapper
            fontSize='16px'
            margin='10px 45px -60px'
            width='90%'>
            {getTranslation('Text')}
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
                label={getTranslation('Text')}
                validate={{
                    touched, errors,
                    isSubmitted: isSubmitted,
                    fieldName: "text"
                }}
            >
                <TextAreaAutoSize style={{height: `${size() * 28}px`, overflowY: 'hidden !important'}} value={actionsText[index].element.text} onChange={(value) => {
                    setFieldValue(`actions[${index}].element.text`, value.target.value)
                }
                } />
                {validation[index] === false && actionsText[index].element.text === '' &&
                    <div style={{ color: 'red', fontSize: '12px' }}>{getTranslation('This field is required')}</div>
                }
            </LabelWrapper>
        </Wrapper>
    </Wrapper>
}

export default I18n(FlowTextCard);
