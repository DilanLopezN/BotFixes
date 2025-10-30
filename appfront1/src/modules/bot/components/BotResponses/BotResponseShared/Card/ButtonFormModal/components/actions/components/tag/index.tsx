import React, { FC } from 'react';
import { Wrapper } from '../../../../../../../../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../../../i18n/components/i18n';
import { StyledFormikField } from '../../../../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { TagsElementAction } from 'kissbot-core';
import { HuePicker } from 'react-color';
import styled from 'styled-components';
import { TagsProps } from './props';
import InputColor from '../../../../../../../../../../../shared/StyledForms/InputColor';

const Delete = styled(Wrapper)`
    position: absolute;
    top: -8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 0px;
    background: #fff;
    border: 1px #ddd solid;
    border-radius: 50%;
    box-shadow: 2px 2px 6px 0px #80808024;
`;

const Minimize = styled(Wrapper)`
    position: absolute;
    top: -8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 35px;
    background: #fff;
    border: 1px #ddd solid;
    border-radius: 50%;
    box-shadow: 2px 2px 6px 0px #80808024;
`;

const TagCard: FC<TagsProps> = ({
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    getTranslation,
    actions,
    index,
    onDeleteAction,
}) => {
    return (
        <Wrapper
            position='relative'
            margin='12px 0'
            padding='3px 10px'
            borderRadius='5px'
            border='1px #e2e2e2 solid'
            bgcolor='#f7f7f7'
            borderBottom='1px #ddd solid'
        >
            <Delete>
                <span
                    style={{ cursor: 'pointer', margin: '0 5px', fontSize: '18px' }}
                    className='mdi mdi-12px mdi-delete-outline'
                    onClick={() => {
                        onDeleteAction(index);
                    }}
                />
            </Delete>
            <Minimize>
                <span
                    style={{ cursor: 'pointer', margin: '0 5px', fontSize: '18px' }}
                    className={`mdi mdi-12px mdi-${actions[index].maximized ? 'chevron-down' : 'chevron-right'}`}
                    onClick={() => {
                        setFieldValue(`actions[${index}].maximized`, !actions[index].maximized);
                    }}
                />
            </Minimize>
            {actions[index].maximized ? (
                <>
                    <Wrapper fontSize='16px' margin='-1px 0 5px -3px'>
                        Tag
                    </Wrapper>
                    <LabelWrapper label={getTranslation('Action')}>
                        <StyledFormikField name={`actions[${index}].element.action`} component='select'>
                            <option value={TagsElementAction.ADD}>{getTranslation('add')}</option>
                        </StyledFormikField>
                    </LabelWrapper>

                    {actions[index].element.action !== TagsElementAction.REMOVE_ALL && (
                        <LabelWrapper
                            label={'Nome'}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'title',
                            }}
                        >
                            <StyledFormikField
                                type='text'
                                autoFocus
                                name={`actions[${index}].element.name`}
                                placeholder={'nome'}
                            />
                        </LabelWrapper>
                    )}

                    {actions[index].element.action === TagsElementAction.ADD && (
                        <Wrapper padding='0 3px' margin='15px 0'>
                            <Wrapper width='60%'>
                                <InputColor
                                    name={`color`}
                                    value={actions[index].element.color}
                                    onChange={(color) => {
                                        const colorful = `#${color}`;
                                        setFieldValue(`actions[${index}].element.color`, colorful);
                                    }}
                                />
                            </Wrapper>
                        </Wrapper>
                    )}
                </>
            ) : (
                <Wrapper>
                    <Wrapper>{actions[index].element.action === TagsElementAction.ADD ? '+' : '-'} Tag</Wrapper>
                    <Wrapper flexBox>
                        <Wrapper
                            margin='0 3px 0 20px'
                            fontWeight='600'
                            borderRadius='12px'
                            padding='1px 7px'
                            color='#FFF'
                            //@ts-ignore
                            bgcolor={actions[index].element.color}
                        >
                            {actions[index].element.name || 'Example'}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default I18n(TagCard);
