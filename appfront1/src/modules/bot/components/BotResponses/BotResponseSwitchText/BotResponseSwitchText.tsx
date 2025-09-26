import { FieldArray, Form, Formik } from 'formik';
import { Entity, IResponseElementSwitchText, SwitchText } from "kissbot-core";
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import { Component } from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { v4 } from 'uuid';
import * as Yup from 'yup';
import { BotAttribute } from "../../../../../model/BotAttribute";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { FieldAttributes } from "../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { EntityActions } from "../../../../entity/redux/actions";
import { BotResponseSwitchTextProps, BotResponseSwitchTextState } from "./BotResponseSwitchTextProps";
import { SetAttributeType } from "../../../../../model/ResponseElement";
import { withRouter } from 'react-router';
import I18n from '../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../utils/Sentry';

const RowContainer = styled("div")`
    width: 100%;
    display:flex;
    margin-bottom:10px;
    position: relative;
`

const FieldArrayContainer = styled("div")``

const ContainerAddNewSwite = styled("span")`    
    position: absolute;
    right: 27px;
    top: -30px;
    font-size: 20px;
    cursor: pointer;
`;

const HrBar = styled("div")`
    border-top: 1px solid #ccc;
    padding-top: 10px;
    width: 100%;
`

const DeleteBtnText = styled(DeleteBtn)`
    position: absolute;
    right: 31px;
    top: 6px;
`

const DeleteBtnDeafault = styled(DeleteBtn)`
    position: absolute;
    right: 31px;
    top: 6px;
`

const CasesLabelContainer = styled("div")`
    width: 100%;
    display:flex;
`

const AddBtnContainer = styled("div")`
    width: 100%;
    display:flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #ccc;
    padding-top: 10px;
    .add-btn{
        margin-right: 5px;
    }
`
const SwitchContainer = styled("div")`
    margin-bottom: 30px;
`

const DefaultContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
`

const DefautlLabelContainer = styled("div")`
    width: calc(100% - 31px);
`

const SwitchTextContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    .text-field-label{
        width: calc(100% - 31px);
    }
`

const Col33 = styled("div")`
    width: 33.33%;
    &:first-child{
        margin-right: 10px;
    }
`

const Col66 = styled("div")`
    width: 66.66%;
    &:first-child{
        margin-right: 10px;
    }
`

class BotResponseSwitchTextClass extends Component<BotResponseSwitchTextProps, BotResponseSwitchTextState>{
    /**
     * TODO:Verificar uma maneira de melhorar essa implementação, pois está muito gambizarra
     * Variável para manter os ids dos texts dos switches. esses id são usados com key, 
     * e devem mudar quando é adicionado ou excluido algum text para poder atualizar o handle bars
     */
    constructor(props) {
        super(props);
    }

    switchTextsIds: { switchIndex: number, textsIds: { textIndex: number, id: string }[] }[] = [];

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            default: Yup.array().of(Yup.string().required("This field is required")).min(1, "This field requires at least one entry"),
            name: Yup.string().required("This field is required"),
            switch: Yup.array().of(
                Yup.object().shape({
                    case: Yup.string().required("This field is required"),
                    text: Yup.array().of(Yup.string().required()).min(1, 'This field requires at least one entry')
                })
            ).min(1, 'This field requires at least one entry')
        });
    };

    onChange = (values, isValid: boolean) => {
        const elements: Array<IResponseElementSwitchText> = this.props.response.elements as Array<IResponseElementSwitchText>
        elements[0] = values;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getAttributeFirstValue = () => {
        const element = this.props.response.elements[0] as IResponseElementSwitchText;
        if (this.props.response && element && element.name != "") {
            return element.name;
        }
        return this.props.botAttributes[0].name
    }

    /**
     * TODO: Melhorar essa implementação pois é gambiarra.
     * Função para gerar o id dos texts dos switches;
     * Chamada na hora de renderizar os texts.
     * Só criar um id para um text se ele não existir
     */
    setSwitchTextId = (switchIndex, textIndex) => {
        const existsSwitchId = !!this.switchTextsIds.find(switchId => switchId.switchIndex == switchIndex);
        if (!existsSwitchId) {
            this.switchTextsIds.push({
                switchIndex,
                textsIds: []
            })
        }
        const existsTextId = !!this.switchTextsIds[switchIndex].textsIds.find(textId => textId.textIndex == textIndex);
        if (!existsTextId) {
            this.switchTextsIds[switchIndex].textsIds.push({
                id: v4(),
                textIndex
            })
        }
    }

    /**
     * TODO: Melhorar essa implementação pois é gambiarra.
     * Função para atualizar todos os ids dos texts do switch.
     * Chamada quando é adicionado ou deletado um novo text.
     * Isso é necessário para atualizar o handle bars quando deleta
     */
    updateSwitchIds = () => {
        this.switchTextsIds = this.switchTextsIds.map(switchId => {
            switchId.textsIds = switchId.textsIds.map(textId => {
                textId.id = v4();
                return textId;
            });
            return switchId;
        })
    }

    render() {
        const { getTranslation } = this.props;

        return <Formik
            initialValues={{
                ...this.props.response.elements[0],
                name: this.getAttributeFirstValue()
            } as BotResponseSwitchTextState}
            onSubmit={() => {
            }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors, handleChange }) => {
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

                this.props.botAttributes.map((botAttribute: BotAttribute, index: number) => {
                    if (botAttribute.type && botAttribute.name === values.name) {
                        values.type = botAttribute.type
                    }
                })


                const entitiySelected = () => {
                    let entity: Array<Entity> = [];
                    let value: any = [];
                    if (isArray(this.props.entitiesList) && !isEmpty(this.props.entitiesList)) {
                        entity = this.props.entitiesList.filter(entity => values.type && entity.name === values.type.slice(1));
                        if (entity && entity[0]) {
                            entity[0].entries.map(entries => {
                                value.push(entries.name)
                            })
                        }

                    }
                    return value;
                };

                const valuesArray = entitiySelected();

                const deleteText = (switchIndex, textIndex) => {
                    const switches = [...values.switch];
                    const texts = switches[switchIndex].text.filter((text, index) => index != textIndex);
                    switches[switchIndex].text = texts;
                    setFieldValue("switch", switches);
                }
                const deleteSwitch = (switchIndex) => {
                    let switches = [...values.switch];
                    switches = switches.filter((switchItem, index) => index != switchIndex);
                    setFieldValue("switch", switches);
                }
                const deleteDefault = (defaultIndex) => {
                    let defaults = [...values.default];
                    defaults = defaults.filter((defaultItem, index) => index != defaultIndex);
                    setFieldValue(`default`, defaults);
                };

                const typeSys = [SetAttributeType.any, SetAttributeType.integer,
                SetAttributeType.number, SetAttributeType.text,
                SetAttributeType.date, SetAttributeType.time, SetAttributeType.email,
                SetAttributeType.boolean, SetAttributeType.command];

                const inputDisebled = !isEmpty(typeSys.filter(ele => values.type === ele));
                return <Form>
                    <RowContainer>
                        <Col33>
                            <LabelWrapper
                                label={getTranslation('Attribute name')}
                                tooltip="Attribute to switch"
                                validate={{
                                    touched, errors,
                                    fieldName: "name",
                                    isSubmitted: this.props.submitted
                                }}
                            >
                                <StyledFormikField name="name" component="select" onChange={(ev) => {
                                    this.props.botAttributes.map((botAttribute: BotAttribute) => {
                                        if (botAttribute.name === values.name) {
                                            values.name = botAttribute.name;
                                        }
                                        if (botAttribute.type && botAttribute.name === values.name) {
                                            values.type = botAttribute.type
                                        } else {
                                            values.type = ""
                                        }
                                    });

                                    if (inputDisebled || isEmpty(values.type)) {
                                        values.switch.map((_, index) => {
                                            values.switch[index].case = "";
                                        })
                                    }
                                    submit()
                                    handleChange(ev);
                                }} onBlur={submit}>
                                    {this.props.botAttributes.map((attr, index) => {
                                        return <option value={attr.name} key={index}>{attr.name}</option>
                                    })}
                                </StyledFormikField>
                            </LabelWrapper>
                        </Col33>
                        <Col66>
                            <LabelWrapper
                                label={getTranslation('Default')}
                                tooltip={`${getTranslation('Default text to send to user when no cases satisfy your condition')}.`}
                            >
                                <FieldArray
                                    name={"default"}
                                    render={(arrayHelpers) => {
                                        return <FieldArrayContainer>
                                            {
                                                values.default.map((defaultText, defaultIndex) => {
                                                    return <DefaultContainer key={defaultIndex}>
                                                        <DefautlLabelContainer>
                                                            <LabelWrapper
                                                                validate={{
                                                                    touched, errors,
                                                                    fieldName: `default[${defaultIndex}]`,
                                                                    isSubmitted: this.props.submitted
                                                                }}
                                                            >
                                                                <FieldAttributes value={defaultText} type="SELECT"
                                                                    onChange={(data) => {
                                                                        setFieldValue(`default[${defaultIndex}]`, data);
                                                                        submit();
                                                                    }} />
                                                            </LabelWrapper>
                                                        </DefautlLabelContainer>
                                                        {
                                                            values.default.length - 1 == defaultIndex
                                                                ? <AddBtn
                                                                    onClick={() => {
                                                                        arrayHelpers.push("");
                                                                        submit();
                                                                    }}
                                                                />
                                                                : null
                                                        }
                                                        {
                                                            values.default.length > 1
                                                                ? <DeleteBtnDeafault
                                                                    onClick={() => {
                                                                        deleteDefault(defaultIndex);
                                                                        submit();
                                                                    }}
                                                                />
                                                                : null
                                                        }
                                                    </DefaultContainer>
                                                })
                                            }
                                        </FieldArrayContainer>
                                    }}
                                />
                            </LabelWrapper>
                        </Col66>
                    </RowContainer>
                    <FieldArray
                        name={"switch"}
                        render={(arraySwitchHelpers) => {
                            return <FieldArrayContainer>
                                {
                                    values.switch.length > 0
                                        ? <HrBar />
                                        : null
                                }
                                {
                                    values.switch.length > 0
                                        ? <CasesLabelContainer>
                                            <Col33>
                                                <LabelWrapper
                                                    label={getTranslation('Case')}
                                                    tooltip={getTranslation('Value of attribute')} />
                                            </Col33>
                                            <Col66>
                                                <LabelWrapper
                                                    label={getTranslation('Random text')}
                                                    tooltip={getTranslation('Random text to show to user when case condition is satisfied')}
                                                />
                                            </Col66>
                                        </CasesLabelContainer>
                                        : null
                                }
                                {values.switch.map((switchText: SwitchText, switchIndex: number) => {
                                    if (values.switch[switchIndex] && isEmpty(values.switch[switchIndex].case)) {
                                        values.switch[switchIndex].case = valuesArray[0]
                                    }
                                   
                                    return <SwitchContainer key={switchIndex}>
                                        <RowContainer>
                                            <Col33>
                                                {
                                                    switchIndex == 0 && !isEmpty(values.switch[switchIndex].case) ? <ContainerAddNewSwite onClick={() => {
                                                        const newSwitch: any = [...values.switch];
                                                        valuesArray.map(element => {
                                                            if (isEmpty(values.switch.filter((switchItem) => switchItem.case === element))) {
                                                                newSwitch.push({
                                                                    case: element,
                                                                    text: [""]
                                                                }
                                                                )
                                                            }
                                                        });
                                                        setFieldValue('switch', newSwitch);
                                                    }} title={getTranslation('Generate switch automatically')}><i className="mdi mdi-flash" />
                                                    </ContainerAddNewSwite> : null
                                                }
                                                <LabelWrapper
                                                    validate={{
                                                        touched, errors,
                                                        fieldName: `switch[${switchIndex}].case`,
                                                        isSubmitted: this.props.submitted
                                                    }}
                                                >
                                                    {
                                                        inputDisebled || isEmpty(values.type) ?
                                                            <StyledFormikField onBlur={submit}
                                                                name={`switch[${switchIndex}].case`}
                                                                type="text" /> :
                                                            <StyledFormikField onBlur={submit}
                                                                name={`switch[${switchIndex}].case`}
                                                                component="select">
                                                                {valuesArray.map((name, index) => {
                                                                    return <option value={name}
                                                                        key={index}
                                                                    >
                                                                        {name}
                                                                    </option>
                                                                })}
                                                            </StyledFormikField>
                                                    }
                                                </LabelWrapper>
                                            </Col33>
                                            <Col66>
                                                <FieldArray
                                                    name={`switch[${switchIndex}].text`}
                                                    render={(arrayTextHelpers) => {
                                                        return switchText.text.map((text, textIndex) => {
                                                            this.setSwitchTextId(switchIndex, textIndex);
                                                            return <SwitchTextContainer
                                                                className="SwitchTextContainer"
                                                                key={this.switchTextsIds[switchIndex].textsIds[textIndex].id}
                                                            >
                                                                <div className="text-field-label">
                                                                    <LabelWrapper
                                                                        validate={{
                                                                            touched, errors,
                                                                            fieldName: `switch[${switchIndex}].text[${textIndex}]`,
                                                                            isSubmitted: this.props.submitted
                                                                        }}
                                                                    >
                                                                        <FieldAttributes value={text} type="SELECT"
                                                                            onChange={(data) => {
                                                                                setFieldValue(`switch[${switchIndex}].text[${textIndex}]`, data);
                                                                                submit();
                                                                            }} />
                                                                    </LabelWrapper>
                                                                </div>
                                                                {
                                                                    textIndex == switchText.text.length - 1
                                                                        ? <AddBtn
                                                                            onClick={() => {
                                                                                this.updateSwitchIds();
                                                                                arrayTextHelpers.push("");
                                                                                submit();
                                                                            }}
                                                                        />
                                                                        : null
                                                                }
                                                                {
                                                                    values.switch.length > 1 || switchText.text.length > 1
                                                                        ? <DeleteBtnText
                                                                            onClick={() => {
                                                                                this.updateSwitchIds();
                                                                                if (switchText.text.length == 1) {
                                                                                    deleteSwitch(switchIndex)
                                                                                } else {
                                                                                    deleteText(switchIndex, textIndex);
                                                                                }
                                                                                submit();
                                                                            }}
                                                                        />
                                                                        : null
                                                                }
                                                            </SwitchTextContainer>
                                                        })
                                                    }}
                                                />
                                            </Col66>
                                        </RowContainer>
                                    </SwitchContainer>
                                })}
                                <AddBtnContainer>
                                    <AddBtn
                                        className="add-btn"
                                        onClick={() => {
                                            arraySwitchHelpers.push({
                                                case: "",
                                                text: [""]
                                            });
                                            submit();
                                        }}
                                    /> {getTranslation('Add case')}
                                </AddBtnContainer>
                            </FieldArrayContainer>
                        }}
                    />
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
    currentBot: state.botReducer.currentBot,
    entitiesList: state.entityReducer.entitiesList,
})

export const BotResponseSwitchText = I18n(withRouter(connect(
    mapStateToProps, {
    setCurrentEntities: EntityActions.setCurrentEntities
}
)(BotResponseSwitchTextClass)));
