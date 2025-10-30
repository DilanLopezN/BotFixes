import { Select } from 'antd';
import { Entity } from 'kissbot-core';
import orderBy from 'lodash/orderBy';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import I18n from '../../../modules/i18n/components/i18n';
import { GetArrayWords } from '../../../modules/i18n/interface/i18n.interface';
import { EntitySelectProps } from './EntitySelectProps';

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
            'Weight',
        ]);
    }

    render() {
        const { value, onChange, handleChange, disabled, fieldName, entitiesList, entitiesListFlow } = this.props;

        const options = [
            {
                label: this.translation['System'],
                options: [
                    { label: this.translation['Any'], value: '@sys.any' },
                    { label: this.translation['Number'], value: '@sys.number' },
                    { label: this.translation['Text'], value: '@sys.text' },
                    { label: this.translation['Full name'], value: '@sys.fullName' },
                    { label: this.translation['Height'], value: '@sys.height' },
                    { label: this.translation['Date'], value: '@sys.date' },
                    { label: this.translation['Time'], value: '@sys.time' },
                    { label: 'Email', value: '@sys.email' },
                    { label: this.translation['Phone'], value: '@sys.phone' },
                    { label: 'CPF', value: '@sys.cpf' },
                    { label: 'CNPJ', value: '@sys.cnpj' },
                    { label: 'PDF', value: '@sys.pdf' },
                    { label: this.translation['Image'], value: '@sys.image' },
                    { label: this.translation['File'], value: '@sys.file' },
                    { label: this.translation['Command'], value: '@sys.command' },
                    { label: this.translation['Weight'], value: '@sys.weight' },
                    { label: 'Carteirinha Unimed', value: '@sys.unimedCard' },
                ],
            },
            {
                label: this.translation['Custom'],
                options: orderBy(entitiesListFlow || entitiesList, ['name']).map((entity: Entity) => ({
                    label: entity.name,
                    value: '@' + entity.name,
                })),
            },
        ];

        return (
            <Select
                size='large'
                value={value}
                disabled={disabled}
                onChange={(val) => {
                    const syntheticEvent = {
                        target: {
                            name: fieldName,
                            value: val,
                        },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;

                    if (onChange) {
                        onChange(syntheticEvent);
                    } else if (handleChange) {
                        handleChange(syntheticEvent);
                    }
                }}
                options={options}
                style={{ width: '100%' }}
                showSearch
                allowClear
                placeholder='Selecione'
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
});

export const EntitySelect = I18n(withRouter(connect(mapStateToProps, {})(EntitySelectClass)));
