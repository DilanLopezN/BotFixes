import React, { Component } from "react";
import { connect } from "react-redux";
import "./EntityForm.scss";
import { FieldArray, Form, Formik } from "formik";
import { isEmpty, isArray } from "lodash";
import * as Yup from "yup";
import { EntityActions } from "../../redux/actions";
import { EntityFormProps, EntityFormState } from "./EntityFormProps";
import { StyledFormikField } from "../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { ItemNotFound } from "../../../../shared/ItemNotFound/ItemNotFound";
import { EntityService } from "../../services/EntityService";
import { v4 } from 'uuid';
import { AddBtn } from "../../../../shared/StyledForms/AddBtn/AddBtn";
import { DeleteBtn } from "../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { Entity } from "kissbot-core";
import { CreatableSelectTags } from "../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags";
import { LabelWrapper } from "../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { EntityModalAttr } from "../EntityModalAttr/EntityModalAttr";
import { ModalConfirm } from "../../../../shared/ModalConfirm/ModalConfirm";
import { WorkspaceActions } from "../../../workspace/redux/actions";
import { Entry } from "kissbot-core/lib";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import ButtonSelect from "../../../../shared/StyledForms/ButtonSelect/ButtonSelect";
import Toggle from "../../../../shared/Toggle/Toggle";
import { SearchBar } from "../../../../shared/SearchBar/SearchBar";
import I18n from "../../../i18n/components/i18n";
import { timeout } from "../../../../utils/Timer";
import { addNotification } from "../../../../utils/AddNotification";
import BlockUi from "../../../../shared-v2/BlockUi/BlockUi";

class EntityFormClass extends Component<EntityFormProps, EntityFormState> {

    constructor(props: any) {
        super(props);
        this.state = {
            isSubmitting: false,
            openedModalIndex: -1,
            entriesList: [],
            searchAttributesValue: "",
            searchEntriesValue: "",
            showAttrs: true,
        };
    }

    adjustmentValues = (values, isValid: boolean) => {
        const synonyms: any = [];
        values.map((entity) => {
            if (entity.value) {
                const synonymArray = entity.value.split(";");
                if (synonymArray.length > 1) {
                    synonymArray.forEach((synonym) => {
                        synonyms.push(synonym);
                    });
                } else {
                    synonyms.push(entity.value);
                }
            }
        });
        return synonyms.filter((element, index) => synonyms.indexOf(element) === index);
    };

    isEntityNameValid = (value, existsName) => {
        return !this.props.entitiesList.find(entity => entity.name === value && entity.name != existsName);
    };

    validateEntryName = (value) => {
        const array = this.state.entriesList.filter(entry => entry === value);
        return array.length < 2
    };

    getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().required("This field is required").test({
                name: 'name',
                message: 'already exists another entity with this name ',
                exclusive: true,
                test: value => {
                    const entity: Entity = this.getEntityCurrent();
                    return this.isEntityNameValid(value, entity.name);

                },
            }),
            entries: Yup.array().of(
                Yup.object().shape({
                    name: Yup.string().required("This field is required").test({
                        name: 'name',
                        message: 'this field cannot be duplicate',
                        exclusive: true,
                        test: value => {
                            return this.validateEntryName(value);
                        },
                    }),
                    synonyms: Yup.array().of(
                        Yup.string()
                    ).min(1)
                })
            )
        });
    };

    componentWillUnmount(): void {
        this.props.setCurrentEntity({});
    }

    setEntriesAttributeIds = (entity: Entity) => {
        entity.entries = entity.entries.map(entry => {
            if (entry.entryAttributes) {
                entry.entryAttributes = entry.entryAttributes.map((value, index) => {
                    const attr = entity.entityAttributes[index];
                    return { ...value, entityAttributeId: attr ? attr.id : "" }
                }).filter(attrVal => attrVal.entityAttributeId != "");
            }
            return entry
        });
        return entity;
    };

    saveEntities = async (entity) => {
        entity = this.setEntriesAttributeIds(entity);
        this.setState({  isSubmitting: true }, async () => {
            const { entityCurrent } = this.props;
            const onError = () => {
                addNotification({
                    message: "Sorry, we get an error!",
                    type: 'danger',
                    duration: 500,
                    insert: "top",
                    container: "top-right",
                });
                this.setState({  isSubmitting: false });
            }
            const saveSuccess = () => {
                addNotification({
                    message: "Entity saved!",
                    type: 'success',
                    duration: 500,
                    insert: "top",
                    container: "top-right",
                });

                return timeout(() => {
                    this.setState({  isSubmitting: false });
                }, 500);
            }

            if (!entityCurrent || !entityCurrent._id) {
                await EntityService.createEntity(entity, this.props.match.params.workspaceId, onError).then(success => {
                    if (!success) return;
                    this.props.setCurrentEntity(success);
                    this.props.addEntity(success);
                    saveSuccess();
                });
            } else {
                await EntityService.updateEntity(entity, this.props.match.params.workspaceId, entityCurrent._id, onError).then(success => {
                    if (!success) return;
                    saveSuccess();
                });
            }
        })
    };

    getEntityCurrent = (): Entity => {
        const { entityCurrent } = this.props;
        if (!isEmpty(entityCurrent)) return entityCurrent;
        return {
            workspaceId: "",
            params: undefined,
            entries: [{ "synonyms": [], "_id": v4(), "name": "", entryAttributes: [] }],
            "name": "",
            entityAttributes: []
        }
    };

    toggleModaldelete = (index?) => {
        this.setState({  openedModalIndex: index })
    };

    renderModalDelete = (cb, index) => {
        return <ModalConfirm
            isOpened={this.state.openedModalIndex == index}
            onAction={(action) => {
                this.toggleModaldelete();
                if (action) cb();
            }}
        >
            <h5>Confirm delete</h5>
            <p>Are you sure you want to delete entry?</p>
        </ModalConfirm>
    };

    searchEntriesValue = (event) => {
        this.setState({
            ...this.state,
            searchEntriesValue: event.target.value
        })
    };

    searchAttributesValue = (event) => {
        this.setState({
            ...this.state,
            searchAttributesValue: event.target.value
        })
    };

    onSearchEntriesValue = (name) => {
        const { searchEntriesValue } = this.state;
        if (!name || !searchEntriesValue) return true
        return name.toLowerCase().indexOf(searchEntriesValue.toLowerCase()) > -1;
    };

    onSearchAttributesValue = (name) => {
        const { searchAttributesValue } = this.state;
        if (!name || !searchAttributesValue) return true
        return name.toLowerCase().indexOf(searchAttributesValue.toLowerCase()) > -1;
    };

    showAttrs = () => {
        this.setState({  showAttrs: !this.state.showAttrs });
    }

    render() {
        const { getTranslation } = this.props;
        let entity = this.getEntityCurrent();
        return !isEmpty(this.props.entityCurrent) ?
            <BlockUi className="EntityForm" blocking={this.state.isSubmitting}>
                <Formik
                    initialValues={entity as Entity}
                    validationSchema={() => this.getValidationSchema()}
                    onSubmit={(values) => this.saveEntities(values)}
                    enableReinitialize
                    isInitialValid={true}
                    render={({ values, setFieldValue, touched, errors, submitCount, setFieldTouched, handleBlur, }) => {
                        return <Form>
                            <div className="row">
                                <div className="col-4">
                                    <LabelWrapper
                                        validate={{
                                            touched, errors,
                                            isSubmitted: submitCount > 0,
                                            fieldName: 'name'
                                        }}
                                        label={getTranslation('Name')}
                                    >
                                        <StyledFormikField name={`name`} type="text" onBlur={(event) => {
                                            handleBlur(event)
                                            setFieldValue('name', values.name);
                                        }} />
                                    </LabelWrapper>
                                </div>
                                <div className="col-6 container-header-btn-save">
                                    <Link to={`/workspace/${this.props.match.params.workspaceId}/entities`} className="btn  btn-outline-danger">
                                        {getTranslation('Cancel')}
                                    </Link>
                                    <EntityModalAttr
                                        schemas={values.entityAttributes}
                                        onChange={(attrList) => {
                                            const newEntryArray: Array<Entry> = [];
                                            values.entries.forEach(entry => {
                                                attrList.forEach(attr => {
                                                    entry.entryAttributes = entry.entryAttributes && entry.entryAttributes.filter(entryAttr =>
                                                        !!attrList.find(attr => attr.id == entryAttr.entityAttributeId));
                                                })
                                                newEntryArray.push(entry);
                                            });
                                            setFieldValue("entityAttributes", attrList)
                                            setFieldValue("entries", newEntryArray);
                                        }}
                                    />
                                    <button type="submit" className="btn btn-primary">
                                        {getTranslation('Save')}
                                    </button>
                                </div>
                            </div>
                            <FieldArray
                                name={"entries"}
                                render={(arrayHelpers) => {
                                    const addItem = () => {
                                        arrayHelpers.push({
                                            synonyms: [],
                                            _id: v4(),
                                            name: ""
                                        });
                                    };
                                    const deleteItem = (index) => {
                                        arrayHelpers.remove(index);
                                    };
                                    return <div>
                                        <hr />
                                        <div className="row button-add my-2">
                                            <div className="col-4 entry-title d-flex align-items-center">
                                                <h5>
                                                    {getTranslation('Entries')}
                                                </h5>
                                                <AddBtn onClick={() => addItem()} />
                                            </div>
                                            <div className="col-3 d-flex justify-content-end">
                                                <LabelWrapper
                                                    label={getTranslation('Show Attributes')}
                                                    tooltip={getTranslation('Show Attributes')}
                                                >
                                                    <ButtonSelect
                                                        onChange={this.showAttrs}
                                                        value={this.state.showAttrs}
                                                        options={[{ label: false }, { label: true }]}
                                                    />
                                                </LabelWrapper>
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="row my-2">
                                            <div className="col-12">
                                                <h5>{getTranslation('Filters')}</h5>
                                            </div>
                                        </div>
                                        <div className="row my-2">
                                            <div className="col-4">
                                                <SearchBar placeholder={getTranslation('Filter entries')}
                                                    onSearch={this.searchEntriesValue} />
                                            </div>
                                            <div className="col-4">
                                                <SearchBar placeholder={getTranslation('Filter attribute')}
                                                    onSearch={this.searchAttributesValue} />
                                            </div>
                                        </div>
                                        <hr />
                                        {values.entries.map((entry: any, index: number) => {
                                            const synonyms = entry.synonyms;

                                            let isVisibleEntryValue = "";

                                            if (!this.onSearchEntriesValue(values.entries[index].name)) {
                                                isVisibleEntryValue = "display-none"
                                            }

                                            return <div className={isVisibleEntryValue} key={index}>
                                                <div className="row my-1">
                                                    <div className="col-4">
                                                        <LabelWrapper
                                                            label={getTranslation('Entry')}
                                                            validate={{
                                                                touched, errors,
                                                                isSubmitted: submitCount > 0,
                                                                fieldName: `entries[${index}].name`
                                                            }}>

                                                            <StyledFormikField name={`entries[${index}].name`}
                                                                placeholder={getTranslation('Entry reference value')}
                                                                onBlur={(event) => {
                                                                    handleBlur(event)
                                                                    setFieldValue('entries', values.entries);
                                                                    const entriesList: Array<any> = values.entries.map((entry: any) => {
                                                                        return entry.name
                                                                    });
                                                                    this.setState({
                                                                        ...this.state,
                                                                        entriesList
                                                                    })
                                                                }}
                                                            />
                                                        </LabelWrapper>
                                                    </div>
                                                    <div className="col-6">
                                                        <LabelWrapper
                                                            label={getTranslation('Synonyms')}
                                                            tooltip={getTranslation(`Synonyms - Tip: you can paste multiple synonyms separated by ;`)}
                                                            validate={{
                                                                touched, errors,
                                                                isSubmitted: submitCount > 0,
                                                                fieldName: `entries[${index}].synonyms`
                                                            }}
                                                        >
                                                            <CreatableSelectTags
                                                                isDisabled={false}
                                                                onChange={(event) => {
                                                                    if (!event) return;
                                                                    setFieldValue(`entries[${index}].synonyms`,
                                                                        this.adjustmentValues(event, false));
                                                                }}
                                                                placeholder={getTranslation('Fill synonym and press enter to add')}
                                                                value={isArray(synonyms) ? synonyms.map((element: any) => {
                                                                    return { value: element, label: element };
                                                                }) : [""]}
                                                                onBlur={() => setFieldTouched(`entries[${index}].synonyms`)}
                                                            />
                                                        </LabelWrapper>
                                                        {this.renderModalDelete(() => {
                                                            deleteItem(index);
                                                        }, index)}
                                                        {
                                                            values.entries.length > 1
                                                                ?
                                                                <DeleteBtn onClick={() => this.toggleModaldelete(index)}
                                                                    className="delete-entries" />
                                                                : null
                                                        }
                                                    </div>
                                                </div>
                                                {this.state.showAttrs
                                                    ? <FieldArray
                                                        name={`entries[${index}].entryAttributes`}
                                                        render={() => {
                                                            return <div>
                                                                {
                                                                    !values.entityAttributes
                                                                        ? null
                                                                        : values.entityAttributes
                                                                            .filter(e => e.name !== '')
                                                                            .map((attr, attrIndex) => {
                                                                                let attributeClass = "";
                                                                                if (!this.onSearchAttributesValue(attr.name)) {
                                                                                    attributeClass = "display-none"
                                                                                }
                                                                                return <div key={attr.id}
                                                                                    className={"row " + attributeClass}>
                                                                                    <div className="col-4">
                                                                                        <LabelWrapper
                                                                                            label={attrIndex == 0 ? "Attribute name" : ""}
                                                                                        >
                                                                                            <StyledFormikField
                                                                                                disabled={true}
                                                                                                type="text"
                                                                                                value={attr.name}
                                                                                                name={`entries[${index}].entryAttributes[${attrIndex}].name`}
                                                                                            />
                                                                                        </LabelWrapper>
                                                                                    </div>
                                                                                    <div className="col-6">
                                                                                        <LabelWrapper
                                                                                            label={attrIndex == 0 ? "Attribute value" : ""}
                                                                                            validate={{
                                                                                                touched, errors,
                                                                                                isSubmitted: submitCount > 0,
                                                                                                fieldName: `entries[${index}].entryAttributes[${attrIndex}].value`
                                                                                            }}
                                                                                        >
                                                                                            <StyledFormikField
                                                                                                type="text"
                                                                                                name={`entries[${index}].entryAttributes[${attrIndex}].value`}
                                                                                            />
                                                                                        </LabelWrapper>
                                                                                    </div>
                                                                                </div>
                                                                            })
                                                                }
                                                                <hr className="my-4" />
                                                            </div>
                                                        }}
                                                    />
                                                    : null}
                                            </div>
                                        })}
                                        <div className="float">
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{getTranslation('Add Entry')}</span>
                                                <div className='d-flex justify-content-center my-1'>
                                                    <AddBtn onClick={() => addItem()} />
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '15px' }}>
                                                <span style={{ fontWeight: 600 }}>{getTranslation('Show Attributes')}</span>
                                                <div className='d-flex justify-content-center my-1'>
                                                    <Toggle
                                                        checked={this.state.showAttrs}
                                                        onChange={ev => {
                                                            this.setState({  showAttrs: ev });
                                                        }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }}
                            />
                        </Form>
                    }}
                />

            </BlockUi> :
            <ItemNotFound
                label="404 Not Found"
                message="Sorry, an error has occured, Requested page not found!"
            />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entityCurrent: state.entityReducer.entityCurrent,
    entitiesList: state.entityReducer.entitiesList,
});

export const EntityForm = I18n(withRouter(connect(
    mapStateToProps, {
    setCurrentEntities: EntityActions.setCurrentEntities,
    addEntity: EntityActions.addEntity,
    setCurrentEntity: EntityActions.setCurrentEntity,
    setWorkspaceListNotAsync: WorkspaceActions.setWorkspaceListNotAsync
}
)(EntityFormClass)));
