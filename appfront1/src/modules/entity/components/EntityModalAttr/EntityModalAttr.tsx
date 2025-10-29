import React, { Component } from "react";
import './EntityModalAttr.scss';
import { EntityModalAttrState, EntityModalAttrProps } from "./EntityModalAttrProps";
import { Modal } from "../../../../shared/Modal/Modal";
import { ModalPosition } from "../../../../shared/Modal/ModalProps";
import { Formik, FieldArray } from "formik";
import { EntityAttribute } from "kissbot-core";
import { StyledFormikField } from "../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { LabelWrapper } from "../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { EntitySelect } from "../../../../shared/StyledForms/EntitySelect/EntitySelect";
import { AddBtn } from "../../../../shared/StyledForms/AddBtn/AddBtn";
import { DeleteBtn } from "../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import * as Yup from "yup";
import { v4 } from 'uuid';
import I18n from "../../../i18n/components/i18n";

class EntityModalAttrClass extends Component<EntityModalAttrProps, EntityModalAttrState>{
    state: EntityModalAttrState = {
        isModalOpened: false,
        attrsSaved: false,
    }

    openModal = () => {
        this.setState({  isModalOpened: true })
    }
    closeModal = (attributes?: any) => {
        if (attributes) {
            this.props.onChange(attributes);
        }
        this.setState({  isModalOpened: false });
    }

    getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attributes: Yup.array().of(
                Yup.object().shape({
                    name: Yup.string()
                })
            )
        });
    };

    private getEmptySchema = (): EntityAttribute => {
        return { name: "", type: "@sys.any", id: v4() }
    }

    getInitialValues = (): Array<EntityAttribute> => {
        if (this.props.schemas && this.props.schemas.length > 0) {
            return this.props.schemas;
        }
        return [this.getEmptySchema()];
    }

    render() {
        const { getTranslation } = this.props;

        return <div className="EntityModalAttr">
            <div className="btn btn-outline-primary" onClick={this.openModal}>
                {getTranslation('Entity attributes')}
            </div>
            {this.state.isModalOpened
                ? <Modal
                    isOpened={this.state.isModalOpened}
                    width="50%"
                    height="auto"
                    position={ModalPosition.center}
                >
                    <Formik
                        initialValues={{ attributes: this.getInitialValues() }}
                        validationSchema={this.getValidationSchema()}
                        onSubmit={(values) => {
                            this.setState({  attrsSaved: true });
                            this.closeModal(values.attributes);
                        }}
                        isInitialValid={true}
                        render={({ values, submitForm, touched, errors, submitCount, handleChange }) => {
                            return <div>
                                <FieldArray
                                    name={"attributes"}
                                    render={(arrayHelpers) => {
                                        return <div className="card">
                                            <div className="card-header">
                                                <h4> {getTranslation('Entity attributes')}</h4>
                                                <span className="mdi mdi-24px mdi-close pointer" onClick={() => {
                                                    this.closeModal();
                                                }} />
                                            </div>
                                            <div className="card-body">
                                                <div className="container">
                                                    {values.attributes.map((_, index) => {
                                                        return <div className="row" key={index}>
                                                            <div className="col-4">
                                                                <LabelWrapper
                                                                    label={getTranslation('Attribute type')}
                                                                    validate={{
                                                                        touched, errors,
                                                                        fieldName: `attributes[${index}].type`,
                                                                        isSubmitted: submitCount > 0
                                                                    }}
                                                                >
                                                                    <EntitySelect
                                                                        onChange={handleChange}
                                                                        fieldName={`attributes[${index}].type`}
                                                                    />
                                                                </LabelWrapper>
                                                            </div>
                                                            <div className="col-8 field-name-container">
                                                                <div className="label-container">
                                                                    <LabelWrapper
                                                                        label={getTranslation('Attribute name')}
                                                                        validate={{
                                                                            touched, errors,
                                                                            fieldName: `attributes[${index}].name`,
                                                                            isSubmitted: submitCount > 0
                                                                        }}
                                                                    >
                                                                        <StyledFormikField
                                                                            type="text"
                                                                            name={`attributes[${index}].name`}
                                                                        />
                                                                    </LabelWrapper>
                                                                </div>
                                                                <DeleteBtn
                                                                    className="delete-btn"
                                                                    onClick={() => {
                                                                        if (values.attributes.length === 1) {
                                                                            arrayHelpers.replace(index, this.getEmptySchema());
                                                                        } else if (values.attributes.length > 1) {
                                                                            arrayHelpers.remove(index)
                                                                        }
                                                                    }}
                                                                />
                                                                {
                                                                    values.attributes.length - 1 == index
                                                                        ? <AddBtn
                                                                            className="add-btn"
                                                                            onClick={() => {
                                                                                arrayHelpers.push(this.getEmptySchema());
                                                                            }}
                                                                        />
                                                                        : null
                                                                }
                                                            </div>
                                                        </div>
                                                    })}
                                                    <div className="button-attribute">
                                                        <button onClick={submitForm} className="btn save-btn btn-primary" type="submit">
                                                            {getTranslation('Save')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }} />
                            </div>
                        }}
                    />
                </Modal>
                : null}
        </div>
    }
}

export const EntityModalAttr = I18n(EntityModalAttrClass);
