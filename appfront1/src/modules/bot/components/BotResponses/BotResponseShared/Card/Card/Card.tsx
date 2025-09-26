import { Checkbox, Divider, Input, Row, Tooltip } from 'antd';
import { Formik } from 'formik';
import { ButtonType, IButton } from 'kissbot-core';
import { Component } from 'react';
import { AiOutlineCopy, AiOutlineDelete } from 'react-icons/ai';
import { GrDrag } from 'react-icons/gr';
import { connect } from 'react-redux';
import { v4 } from 'uuid';
import * as Yup from 'yup';
import { IResponseElementCard } from '../../../../../../../model/ResponseElement';
import { FormPopup } from '../../../../../../../shared/FormPopup/FormPopup';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import I18n from '../../../../../../i18n/components/i18n';
import { ButtonFormModal } from '../ButtonFormModal/ButtonFormModal';
import { CardHeaderImage } from '../CardHeaderImage/CardHeaderImage';
import { CardProps, CardState } from './CardProps';
import { AddBtnContainer, AddNewFieldBtn, BtnTitle, CardWrapper, DragAndDrop, StyledForm } from './styles';

const { TextArea } = Input;

class CardClass extends Component<CardProps, CardState> {
    state = {
        openedButtonIndex: -1,
    };

    getValidationSchema = () => {
        return Yup.object().shape({
            text: Yup.string().when('buildAsList', {
                is: true,
                then: (schema) => schema.required('O campo "Texto" é obrigatório ao enviar como lista'),
            }),

            buttons: Yup.array().of(
                Yup.object().shape({
                    title: Yup.string().required('O título do botão é obrigatório'),
                    value: Yup.string().when('title', {
                        is: (title) => title && title.trim().length > 0,
                        then: Yup.string().required('O valor do botão é obrigatório quando o título está presente'),
                        otherwise: Yup.string(),
                    }),
                })
            ),
            footer: Yup.string().max(60, 'A mensagem do rodapé deve ter no máximo 60 caracteres'),
        });
    };

    setOpenedButtonIndex = (index?: number) => {
        this.setState({ openedButtonIndex: index });
    };

    onChange = (values: IResponseElementCard, isValid: boolean) => {
        this.props.onChange(values, isValid);
    };
    onError = (value: any) => {
        if (!value) return true;

        const interaction = this.props.interactionList.find((interaction) => interaction._id === value);

        return interaction ? true : false;
    };

    getCharacterLimits = (values: IResponseElementCard) => {
        if (values.buildAsQuickReply) {
            return {
                title: 60,
                subtitle: 24,
                text: 4096,
                buttonTitle: 20,
                footer: 60,
            };
        } else if (values.buildAsList) {
            return {
                title: 60,
                subtitle: 24,
                text: 4096,
                buttonTitle: 24,
                footer: 60,
            };
        }
        return {
            title: null,
            subtitle: null,
            text: null,
            buttonTitle: null,
        };
    };
    renderForm = () => {
        const { getTranslation } = this.props;
        let draggedButton: number;
        return (
            <Formik
                initialValues={{ ...this.props.card } as IResponseElementCard}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({ submitForm, values, setFieldValue, validateForm, errors, touched }) => {
                    const buttonCount = Array.isArray(values.buttons) ? values.buttons.length : 0;
                    const characterLimits = this.getCharacterLimits(values);

                    const limitsLengthQuickReply =
                        (values.title && values.title.length > 60) ||
                        (values.subtitle && values.subtitle.length > 24) ||
                        (values.text && values.text.length > 4096) ||
                        values.buttons?.some((button) => button.title.length > 20) ||
                        false;

                    const limitsLengthList =
                        (values.title && values.title.length > 60) ||
                        (values.subtitle && values.subtitle.length > 24) ||
                        (values.text && values.text.length > 4096) ||
                        values.buttons?.some((button) => button.title.length > 24) ||
                        false;

                    const submit = () => {
                        validateForm()
                            .then((validatedValues: any) => {
                                if (validatedValues.isCanceled) {
                                    submit();
                                    return;
                                }

                                if (Object.keys(validatedValues).length !== 0) {
                                    this.onChange(values, false);
                                } else {
                                    this.onChange(values, true);
                                }
                                submitForm();
                            })
                            .catch((e) => dispatchSentryError(e));
                    };
                    const addButton = (button?: IButton) => {
                        const buttons = values.buttons || [];
                        if (button) {
                            buttons.push({ ...button, title: `${getTranslation('Button')} #${buttons.length + 1}` });
                        } else {
                            buttons.push({
                                title: `${getTranslation('Button')} #${buttons.length + 1}`,
                                value: '',
                                type: ButtonType.goto,
                            });
                        }
                        setFieldValue(`buttons`, buttons);
                        submit();
                        this.setOpenedButtonIndex(buttons.length - 1);
                    };

                    const deleteButton = (index) => {
                        const buttons = !values.buttons
                            ? []
                            : values.buttons.filter((button, indexBtn) => {
                                  return indexBtn !== index;
                              }) || [];
                        setFieldValue(`buttons`, buttons);
                        values.buttons = buttons;
                        submit();
                    };

                    const setButtons = (button: IButton, buttonIndex) => {
                        const buttons = values.buttons || [];
                        buttons[buttonIndex] = button;
                        setFieldValue(`buttons`, buttons);
                    };

                    const onDragStart = (event: React.DragEvent<HTMLDivElement>, button: IButton, index) => {
                        draggedButton = Number(index);
                        event.dataTransfer.setData('text/plain', JSON.stringify(button));
                        event.dataTransfer.effectAllowed = 'move';
                        const emptyImage = new Image();
                        emptyImage.onload = () => {
                            event.dataTransfer.setDragImage(emptyImage, emptyImage.width / 4, emptyImage.height / 4);
                        };
                        emptyImage.src = '';
                    };

                    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
                        event.preventDefault();
                        event.currentTarget.classList.add('dragged');
                        event.dataTransfer.dropEffect = 'move';
                    };

                    const onDrop = (event, dropedButton) => {
                        event.preventDefault();
                        const cardButtons = values.buttons || [];
                        const newData = [...(values.buttons || [])];
                        newData.splice(draggedButton, 1);
                        newData.splice(dropedButton, 0, cardButtons[draggedButton]);
                        values.buttons = newData;
                        setFieldValue('buttons', newData);
                        submit();
                    };

                    const onChangeCardHeaderImage = (media) => {
                        values.media = media;
                        setFieldValue(`media`, media);
                        submit();
                    };

                    const getTooltipTitle = (buttonCount) => {
                        if (buttonCount > 3) {
                            return getTranslation('Maximum number of buttons reached (3 max)');
                        } else if (limitsLengthQuickReply) {
                            return getTranslation('Verify the number of characters entered');
                        }
                        return '';
                    };

                    const getTooltipTitleBuildList = (buttonCount) => {
                        if (buttonCount > 10) {
                            return getTranslation('Maximum number of buttons reached (10 max)');
                        } else if (limitsLengthList) {
                            return getTranslation('Verify the number of characters entered');
                        }
                        return '';
                    };

                    const renderButtons = () => {
                        const buttons = values.buttons || [];
                        return buttons.map((button, index) => (
                            <>
                                <div
                                    key={index}
                                    className='button'
                                    draggable
                                    onDragStart={(event) => onDragStart(event, button, index)}
                                    onDragOver={onDragOver}
                                    onDrop={(event) => onDrop(event, index)}
                                >
                                    <FormPopup
                                        key={v4()}
                                        preferPlace='above'
                                        isOpenedPopover={this.state.openedButtonIndex === index}
                                        onClose={() => {
                                            submit();
                                            this.setOpenedButtonIndex();
                                        }}
                                        popupBody={
                                            <ButtonFormModal
                                                isSubmitted={this.props.isSubmitted}
                                                button={button}
                                                buildAsQuickReply={values.buildAsQuickReply}
                                                buildAsList={values.buildAsList}
                                                onChange={(button) => setButtons(button, index)}
                                                onClose={() => {
                                                    submit();
                                                    this.setOpenedButtonIndex();
                                                }}
                                                onDelete={() => deleteButton(index)}
                                            />
                                        }
                                    >
                                        <Row
                                            align={'middle'}
                                            style={{
                                                padding: '3px 0',
                                                marginBottom: '2px',
                                                border: '1px solid #e4e9f0 ',
                                                borderRadius: '3px',
                                                gap: '8px',
                                            }}
                                            onClick={() => this.setOpenedButtonIndex(index)}
                                        >
                                            <GrDrag size={20} style={{ cursor: 'grab', marginLeft: '5px' }} />

                                            <BtnTitle title={button.title}>{button.title}</BtnTitle>
                                            <AiOutlineCopy
                                                size={22}
                                                title='Copiar'
                                                cursor={'pointer'}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    addButton(button);
                                                }}
                                            />
                                            <AiOutlineDelete
                                                size={22}
                                                style={{ marginRight: '5px' }}
                                                title='Deletar'
                                                cursor={'pointer'}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    deleteButton(index);
                                                }}
                                            />
                                        </Row>
                                    </FormPopup>
                                </div>
                            </>
                        ));
                    };

                    return (
                        <StyledForm>
                            <CardHeaderImage
                                onChange={(media) => {
                                    onChangeCardHeaderImage(media);
                                }}
                                media={values.media}
                            />

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'title',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input
                                    name='title'
                                    placeholder={getTranslation('Title')}
                                    maxLength={characterLimits.title || undefined}
                                    showCount={characterLimits.title !== null}
                                    value={values.title || ''}
                                    onChange={(e) => {
                                        setFieldValue('title', e.target.value);
                                    }}
                                    onBlur={submit}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'subtitle',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input
                                    name='subtitle'
                                    placeholder={getTranslation('Sub title')}
                                    maxLength={characterLimits.subtitle || undefined}
                                    showCount={characterLimits.subtitle !== null}
                                    value={values.subtitle || ''}
                                    onChange={(e) => {
                                        setFieldValue('subtitle', e.target.value);
                                    }}
                                    onBlur={submit}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'text',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <TextArea
                                    name='text'
                                    placeholder={getTranslation('Text')}
                                    maxLength={characterLimits.text || undefined}
                                    showCount={characterLimits.text !== null}
                                    value={values.text || ''}
                                    onChange={(e) => {
                                        setFieldValue('text', e.target.value);
                                    }}
                                    onBlur={submit}
                                    autoSize={{ minRows: 3, maxRows: 6 }}
                                />
                            </LabelWrapper>

                            {(values.buildAsQuickReply || values.buildAsList) && (
                                <LabelWrapper
                                    validate={{
                                        errors,
                                        touched,
                                        fieldName: 'footer',
                                        isSubmitted: this.props.isSubmitted,
                                    }}
                                >
                                    <Input
                                        name='footer'
                                        placeholder={getTranslation('Footer')}
                                        maxLength={60}
                                        showCount
                                        value={values.footer || ''}
                                        onChange={(e) => {
                                            setFieldValue('footer', e.target.value);
                                        }}
                                        onBlur={submit}
                                    />
                                </LabelWrapper>
                            )}

                            <DragAndDrop>{renderButtons()}</DragAndDrop>
                            <AddBtnContainer onClick={() => addButton()}>
                                <AddNewFieldBtn />
                                {getTranslation('Add button')}
                            </AddBtnContainer>

                            <Divider style={{ margin: '5px 0 8px 0' }} />
                            <Tooltip title={getTooltipTitle(buttonCount)}>
                                <Checkbox
                                    checked={values.buildAsQuickReply}
                                    disabled={buttonCount > 3 || limitsLengthQuickReply}
                                    onChange={() => {
                                        const quickReplyValue = !values.buildAsQuickReply;
                                        values.buildAsQuickReply = quickReplyValue;
                                        values.buildAsList = false;
                                        setFieldValue('buildAsQuickReply', quickReplyValue);
                                        setFieldValue('buildAsList', false);
                                        submit();
                                    }}
                                >
                                    <div style={{ padding: '0 0 20px 0' }}>
                                        {getTranslation('Send as quick replay')}
                                    </div>
                                </Checkbox>
                            </Tooltip>

                            <Tooltip title={getTooltipTitleBuildList(buttonCount)}>
                                <Checkbox
                                    checked={values.buildAsList}
                                    disabled={buttonCount > 10 || limitsLengthList}
                                    onChange={() => {
                                        const listValue = !values.buildAsList;
                                        values.buildAsList = listValue;
                                        values.buildAsQuickReply = false;
                                        setFieldValue('buildAsList', listValue);
                                        setFieldValue('buildAsQuickReply', false);
                                        submit();
                                    }}
                                >
                                    <div style={{ padding: '0 0 20px 0' }}>{getTranslation('Send as list')}</div>
                                </Checkbox>
                            </Tooltip>
                            {!!values?.buildAsList ? (
                                <LabelWrapper
                                    validate={{
                                        errors,
                                        touched,
                                        fieldName: 'titleButtonList',
                                        isSubmitted: this.props.isSubmitted,
                                    }}
                                >
                                    <Input
                                        name='titleButtonList'
                                        placeholder={getTranslation('List menu button text')}
                                        maxLength={60}
                                        showCount
                                        value={values.titleButtonList || ''}
                                        onChange={(e) => {
                                            setFieldValue('titleButtonList', e.target.value);
                                        }}
                                        onBlur={submit}
                                    />
                                </LabelWrapper>
                            ) : null}
                        </StyledForm>
                    );
                }}
            />
        );
    };

    render() {
        return <CardWrapper className='card'>{this.renderForm()}</CardWrapper>;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
});

export const Card = I18n(connect(mapStateToProps, {})(CardClass));
