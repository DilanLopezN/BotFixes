import { Input } from 'antd';
import { ResponseButtonType } from 'kissbot-core';
import { FC, useEffect } from 'react';
import { Interaction, InteractionType } from '../../../../../../../../../model/Interaction';
import { LabelWrapper } from '../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../i18n/components/i18n';
import { ButtonSelector } from '../../../ButtonTypeSelector/ButtonTypeSelector';
import { TypeInput } from '../../../TypeInput/TypeInput';
import { GeneralProps } from './props';

const General: FC<GeneralProps> = ({
    getTranslation,
    interactionList,
    values,
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    buildAsQuickReply,
    buildAsList,
}) => {
    const getValue = (type) => {
        if (type == ResponseButtonType.goto) {
            const filteredInteractionList = interactionList.filter((interation: Interaction) => {
                return (
                    interation.type != InteractionType.contextFallback &&
                    interation.type != InteractionType.fallback &&
                    interation.type != InteractionType.container
                );
            });
            return filteredInteractionList[0]._id;
        }
        return '';
    };

    const getTitleMaxLength = (): number => {
        if (buildAsQuickReply) {
            return 20;
        } else if (buildAsList) {
            return 24;
        } else {
            return 150;
        }
    };

    const currentMaxLength = getTitleMaxLength();

    return (
        <div>
            <LabelWrapper
                label={getTranslation('Button title')}
                tooltip={getTranslation('Button title that will appear on bot conversation card')}
                validate={{
                    touched,
                    errors,
                    isSubmitted: isSubmitted,
                    fieldName: 'title',
                }}
            >
                <Input
                    key={`title-${buildAsQuickReply}-${buildAsList}`}
                    name='title'
                    placeholder={getTranslation('Button title')}
                    maxLength={currentMaxLength}
                    showCount
                    value={values.title || ''}
                    onChange={(e) => setFieldValue('title', e.target.value)}
                />
            </LabelWrapper>
            <LabelWrapper
                label={getTranslation('Button Description')}
                tooltip={getTranslation('Description for button in list')}
                validate={{
                    touched,
                    errors,
                    isSubmitted: isSubmitted,
                    fieldName: 'description',
                }}
            >
                <Input
                    name='description'
                    placeholder={getTranslation('Button Description')}
                    maxLength={72}
                    showCount
                    value={values.description || ''}
                    onChange={(e) => setFieldValue('description', e.target.value)}
                />
            </LabelWrapper>
            <ButtonSelector
                onChange={(type) => {
                    setFieldValue('type', type);
                    setFieldValue('value', getValue(type));
                }}
                type={values.type}
            />
            <TypeInput
                type={(values.type as any) || ResponseButtonType.goto}
                value={values.value || ''}
                touched={touched}
                errors={errors}
                setFieldValue={setFieldValue}
                isSubmitted={isSubmitted}
            />
        </div>
    );
};

export default I18n(General);
