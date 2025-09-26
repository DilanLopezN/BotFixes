import { Component } from "react";
import { Entity } from "kissbot-core";
import { connect } from "react-redux";
import { EntitySelectProps } from "./EntitySelectProps";
import { withRouter } from "react-router";
import orderBy from 'lodash/orderBy';
import I18n from "../../../modules/i18n/components/i18n";
import { GetArrayWords } from "../../../modules/i18n/interface/i18n.interface";
import { SimpleSelect } from "../../SimpleSelect/SimpleSelect";

class EntitySelectClass extends Component<EntitySelectProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<EntitySelectProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Number',
            'Date',
            'Text',
            'Time',
            'Any',
            'System',
            'File',
            'Full name',
            'Height',
            'Image',
            'Custom',
            'Phone',
            'Command',
            'Weight'
        ]);
    }
    render() {
        return <SimpleSelect
            onChange={this.props.onChange || this.props.handleChange}
            name={this.props.fieldName}
            disabled={this.props.disabled}
            value={this.props.value}
        >
            <optgroup label={this.translation['System']}>
                <option value="@sys.any">{this.translation['Any']}</option>
                <option value="@sys.number">{this.translation['Number']}</option>
                <option value="@sys.text">{this.translation['Text']}</option>
                <option value="@sys.fullName">{this.translation['Full name']}</option>
                <option value="@sys.height">{this.translation['Height']}</option>
                <option value="@sys.date">{this.translation['Date']}</option>
                <option value="@sys.time">{this.translation['Time']}</option>
                <option value="@sys.email">Email</option>
                <option value="@sys.phone">{this.translation['Phone']}</option>
                <option value="@sys.cpf">CPF</option>
                <option value="@sys.cnpj">CNPJ</option>
                <option value="@sys.pdf">PDF</option>
                <option value="@sys.image">{this.translation['Image']}</option>
                <option value="@sys.file">{this.translation['File']}</option>
                <option value="@sys.command">{this.translation['Command']}</option>
                <option value="@sys.weight">{this.translation['Weight']}</option>
                <option value="@sys.unimedCard">{'Carteirinha Unimed'}</option>
            </optgroup>
            <optgroup label={this.translation['Custom']}>
                {
                    orderBy(this.props.entitiesListFlow || this.props.entitiesList, ['name'])
                        .map((entity: Entity, index) => {
                            return <option value={"@" + entity.name} key={index}>{entity.name}</option>
                        })
                }
            </optgroup>
        </SimpleSelect>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
});

export const EntitySelect = I18n(withRouter(connect(
    mapStateToProps,
    {}
)(EntitySelectClass)));
