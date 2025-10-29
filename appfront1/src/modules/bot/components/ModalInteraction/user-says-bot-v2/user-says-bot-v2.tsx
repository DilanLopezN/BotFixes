import { Col, Divider, Form, Row } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { ContentState, convertFromHTML, EditorState, DraftComponent } from 'draft-js';
import { IPart } from 'kissbot-core';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { IUserSay } from '../../../../../model/Interaction';
import { FlexTextEditor } from '../../../../../shared-v2/flex-text-editor';
import { DraftType } from '../../../../../shared-v2/flex-text-editor/enum/draft-type.enum';
import { FlexTextType } from '../../../../../shared-v2/flex-text-editor/enum/flex-text-type.enum';
import { IPartDefault } from '../../../../../shared-v2/flex-text-editor/enum/i-part-default.enum';
import I18nWrapper from '../../../../i18n/components/i18n';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { EntityMap, Interval, IPartId, UserSaysBotProps } from './interfaces';
import { AnimatedButton, DeleteIcon } from './styles';

const buildTextFromParts = (parts: IPart[]): string => {
    let text = '';
    parts?.forEach((part) => {
        if (part?.type) {
            text += `{{${part.value}}}`;
        } else {
            text += part?.value;
        }
    });
    return text;
};

const UserSays: React.FC<UserSaysBotProps> = ({ getTranslation, userSays, onChangeInput, isSubmitted }) => {
    const [usersParts, setUsersParts] = useState<IUserSay[]>(userSays);
    const [editorContent, setEditorContent] = useState<ContentState>(EditorState.createEmpty().getCurrentContent());
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const { disabledFields } = useContext(DisabledTypeContext);
    const [form] = useForm();
    const newEditorRefs = useRef<(DraftComponent.Base.DraftEditor | null)[]>([]);
    const initialEditorContentRef = useRef<ContentState>(editorContent);

    const initialValues = useMemo(
        () => ({
            userSaysParts: usersParts.map((userSay) => buildTextFromParts(userSay.parts)),
        }),
        [usersParts]
    );

    const containsDefaultValue = (parts: IUserSay[]) => {
        return parts.some((userPart) => userPart.parts.some((part) => part.value.includes(IPartDefault.parameter)));
    };

    const hasFormValidationErrors = async (form) => {
        try {
            await form.validateFields();
            return true;
        } catch (errorInfo) {
            return false;
        }
    };

    const onChangeHandler = async (updatedUsersParts: IUserSay[]) => {
        setUsersParts(updatedUsersParts);
        const containsDefault = containsDefaultValue(updatedUsersParts);
        const hasErrors = await hasFormValidationErrors(form);
        setTimeout(() => {
            onChangeInput(updatedUsersParts, !containsDefault && hasErrors);
        }, 0);
    };

    const handleDelete = (index: number, remove) => {
        const updatedUsers = [...usersParts];
        updatedUsers.splice(index, 1);
        onChangeHandler(updatedUsers);
        remove(index);
    };

    const handleAdd = (add) => {
        const newUser: IUserSay = { parts: [{ value: '' }], _id: uuidv4() };
        const updatedUsers = [...usersParts, newUser];
        setUsersParts(updatedUsers);
        setFocusedIndex(updatedUsers.length - 1);
        add({ value: '', parts: newUser.parts, _id: newUser._id });
    };

    const assignOptionsToAttribute = useCallback(
        (contentState: ContentState, idUserSays: string) => {
            const text = contentState.getPlainText();
            const entityDataMap: Record<string, IPartId> = {};
            const intervals: Interval[] = [];

            contentState.getBlockMap().forEach((block) => {
                if (block) {
                    block.findEntityRanges(
                        (character) => character.getEntity() !== null,
                        (start, end) => {
                            const entityKey = block.getEntityAt(start);
                            const entity = contentState.getEntity(entityKey);
                            const entityData = JSON.parse(JSON.stringify(entity.getData()));
                            entityDataMap[entityKey.toString()] = {
                                ...entityData,
                                id: entityKey.toString(),
                            };
                            intervals.push({ start, end, entityKey: entityKey.toString() });
                        }
                    );
                }
            });

            intervals.sort((a, b) => a.start - b.start);
            let previousEnd = 0;
            const pureTextIntervals: Interval[] = [];

            for (const interval of intervals) {
                if (previousEnd < interval.start) {
                    pureTextIntervals.push({ start: previousEnd, end: interval.start });
                }
                previousEnd = interval.end;
            }
            if (previousEnd < text.length) {
                pureTextIntervals.push({ start: previousEnd, end: text.length });
            }

            const combinedIntervals = [...intervals, ...pureTextIntervals].sort((a, b) => a.start - b.start);

            const result: IPart[] = [];
            let currentPartIndex = 0;

            for (let i = 0; i < combinedIntervals.length; i++) {
                const interval = combinedIntervals[i];

                if ('entityKey' in interval) {
                    const entityData = entityDataMap[interval.entityKey];
                    const existingPart = result.find((part) => part.value === entityData.value);

                    const partType = existingPart ? existingPart.type : entityData.type || 'default';
                    const partMandatory = existingPart ? existingPart.mandatory : entityData.mandatory ?? false;

                    result.push({
                        value: entityData?.value,
                        name: entityData.value,
                        type: partType,
                        mandatory: partMandatory,
                    });

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    currentPartIndex++;
                    if (i + 1 < combinedIntervals.length && 'entityKey' in combinedIntervals[i + 1]) {
                        result.push({ value: ' ' });
                    }
                } else {
                    const textValue = text.slice(interval.start, interval.end);
                    if (textValue) {
                        result.push({ value: textValue });
                    }
                }
            }

            const content = createEntityMap(result, contentState);
            const editorState = EditorState.createWithContent(content);
            setEditorContent(editorState.getCurrentContent());
            return { parts: result, _id: idUserSays };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userSays]
    );
    const createEntityMap = useCallback((userSaysParts, contentState) => {
        const text = contentState.getPlainText();
        const entityMapVariables: EntityMap = userSaysParts?.reduce(
            (acc: EntityMap, variable: IPart, index: number) => {
                const hasTypeAndMandatory = variable?.type && typeof variable?.mandatory !== 'undefined';

                const data = {
                    value: hasTypeAndMandatory ? `{{${variable.value}}}` : variable.value,
                    variable: {
                        value: variable?.value,
                        name: variable?.name,
                        type: variable?.type,
                        mandatory: variable?.mandatory,
                    },
                };

                const entityKey = `entity-${index}`;

                acc[entityKey] = {
                    type: hasTypeAndMandatory ? 'VARIABLE' : 'TEXT',
                    mutability: hasTypeAndMandatory ? DraftType.MUTABLE : DraftType.IMMUTABLE,
                    data,
                };

                return acc;
            },
            {}
        );
        const blocksFromHTML = convertFromHTML(text);

        const content = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, entityMapVariables);

        const editorState = EditorState.createWithContent(content);
        const currentContent = editorState.getCurrentContent();
        return currentContent;
    }, []);

    const validateUserSays = async (_, value) => {
        if (!value) {
            return Promise.reject(getTranslation('This field is required'));
        }
        return Promise.resolve();
    };

    const handleEntityChange =
        (userSaysPart: IUserSay, onChangeHandler: Function) => async (contentState: ContentState) => {
            setEditorContent(contentState);
            initialEditorContentRef.current = contentState;
            const idUserSays = userSaysPart?._id || uuidv4();
            const updatedUsersParts = usersParts.map((userSay) => {
                if (userSay._id === idUserSays) {
                    const iUserSay = assignOptionsToAttribute(contentState, idUserSays);
                    return iUserSay;
                }
                return userSay;
            });
            await onChangeHandler(updatedUsersParts);
        };

    useEffect(() => {
        if (
            focusedIndex !== null &&
            focusedIndex < newEditorRefs.current.length &&
            newEditorRefs.current[focusedIndex] !== null
        ) {
            setTimeout(() => {
                newEditorRefs.current[focusedIndex]?.focus();
            }, 500);
        }
    }, [focusedIndex]);

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setTimeout(() => form.validateFields(), 300);
    }, [form, initialValues]);

    return (
        <Form layout='vertical' form={form}>
            <Form.Item label={getTranslation('User says')} tooltip={getTranslation('User says')}>
                <Form.List name='userSaysParts'>
                    {(fields, { add, remove }) => {
                        return (
                            <>
                                {fields.map((field, index) => {
                                    const userSaysPart = usersParts[index];

                                    let initialText = buildTextFromParts(userSaysPart?.parts);

                                    return (
                                        <div key={field.key}>
                                            <Row gutter={[16, 16]}>
                                                <Col span={22}>
                                                    <Form.Item
                                                        {...field}
                                                        style={{ margin: 0 }}
                                                        hasFeedback
                                                        name={[field.name]}
                                                        validateFirst
                                                        validateTrigger={['onChange', 'onBlur', 'onValuesChange']}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                validator: validateUserSays,
                                                            },
                                                        ]}
                                                    >
                                                        <FlexTextEditor
                                                            userSaysParts={userSaysPart?.parts}
                                                            typeBlock={FlexTextType.CREATE}
                                                            initialText={initialText}
                                                            maxLength={4096}
                                                            disabled={false}
                                                            onEntityChange={handleEntityChange(
                                                                userSaysPart,
                                                                onChangeHandler
                                                            )}
                                                            ref={(ref) => (newEditorRefs.current[index] = ref)}
                                                            initialContent={editorContent}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2}>
                                                    {!disabledFields ? (
                                                        <DeleteIcon onClick={() => handleDelete(index, remove)} />
                                                    ) : null}
                                                </Col>
                                            </Row>
                                            <Divider style={{ margin: '12px 0' }} />
                                        </div>
                                    );
                                })}
                                <Row justify={'center'}>
                                    <Form.Item>
                                        <AnimatedButton size='middle' type='link' onClick={() => handleAdd(add)} block>
                                            {getTranslation('Add')}
                                            <FaPlus style={{ margin: '0 0 4px 2px' }} />
                                        </AnimatedButton>
                                    </Form.Item>
                                </Row>
                            </>
                        );
                    }}
                </Form.List>
            </Form.Item>
        </Form>
    );
};

export const UserSaysBotV2 = I18nWrapper(UserSays);
