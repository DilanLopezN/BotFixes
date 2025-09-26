import React, { Component } from 'react';
import './Filter.scss';
import { FilterProps, FilterState } from './FilterProps';
import { FilterType, ICondition } from '../../../../../model/Interaction';
import { FilterForm } from '../FilterForm/FilterForm';
import I18n from '../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { ConditionMethodType } from 'kissbot-core';

class FilterClass extends Component<FilterProps, FilterState> {
    constructor(props) {
        super(props);
        this.state = {
            createdNewFilter: false,
        };
    }

    addFilter = () => {
        const filters = { ...this.props.filter };
        filters.conditions.push({
            name: 'default_id',
            operator: ConditionMethodType.equals,
            value: '',
            type: FilterType.attribute,
            isConditionValid: false,
        });

        this.setState({
            ...this.state,
            createdNewFilter: true,
        });

        this.props.onConditionsChange(filters.conditions);
    };

    onFilterFormSubmit = (value: ICondition, index) => {
        const filters = { ...this.props.filter };
        filters.conditions[index] = value;
        this.props.onConditionsChange(filters.conditions);
        this.forceUpdate();
    };

    delete = (index: number) => {
        //Não confundir filter da regra de negócio com filter do array nativo do javascript
        const newConditions: Array<ICondition> = this.props.filter.conditions.filter(
            (_: ICondition, filterIndex: number) => {
                return index !== filterIndex;
            }
        );
        this.props.onConditionsChange(newConditions);
        this.forceUpdate();
    };

    renderFilters = () => {
        return this.props.filter
            ? this.props.filter.conditions.map((condition: ICondition, index) => {
                  if (condition.isConditionValid == undefined) condition.isConditionValid = true;
                  return (
                      <FilterForm
                          submitted={this.props.submitted}
                          onDelete={() => this.delete(index)}
                          onSubmit={(values) => this.onFilterFormSubmit(values, index)}
                          onOperatorChange={this.props.onOperatorChange}
                          condition={condition}
                          filterOperator={this.props.filter.operator}
                          key={index}
                          createdNewFilter={this.state.createdNewFilter}
                      />
                  );
              })
            : {};
    };

    render() {
        return (
            <div className='Filter'>
                <>
                    {this.props.getTranslation('Filters')}
                    {this.renderFilters()}
                    <DisabledTypeContext.Consumer>
                        {({ disabledFields }) => {
                            return (
                                <div
                                    className='btn-add pointer'
                                    onClick={() => {
                                        if (!disabledFields) {
                                            this.addFilter();
                                        }
                                    }}
                                >
                                    <span className='mdi mdi-plus' />
                                </div>
                            );
                        }}
                    </DisabledTypeContext.Consumer>
                </>
            </div>
        );
    }
}

export const Filter = I18n(connect(null, null)(FilterClass));
