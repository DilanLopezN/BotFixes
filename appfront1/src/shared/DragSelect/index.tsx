import React, { FC } from 'react';
import Select, { components } from 'react-select-latest';
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc';

const customStyles = {
    option: (provided) => ({
        ...provided,
    }),
    control: (p, state) => ({
        minHeight: '42px !important',
        background: '#fff !important',
        display: 'flex',
        borderRadius: '4px',
        fontSize: '16px',
        border: state.isFocused ? '1px solid rgba(3, 102, 214, 0.6)' : '1px solid #d9d9d9',
        boxShadow: "0 2px 15px 0 rgba(0,0,0,.07)",
        ':hover': {
            border: '1px solid rgba(3, 102, 214, 0.6)'
        }
    }),
    singleValue: (provided, state) => {
        const color = '#647384';
        return { ...provided, color };
    },
    placeholder: () => ({
        color: '#e6e6e6'
    })
};

function arrayMove(array, from, to) {
    array = array.slice();
    array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
    return array;
}

const SortableMultiValue = SortableElement(props => {
    const onMouseDown = e => {
        e.preventDefault();
        e.stopPropagation();
    };
    const innerProps = { ...props.innerProps, onMouseDown };
    return <components.MultiValue className={'item-select-drag'} {...props} innerProps={innerProps} />;
});

const SortableMultiValueLabel = SortableHandle(props => (
    <components.MultiValueLabel {...props} />
));

const SortableSelect = SortableContainer(Select);

export interface DragSelectProps {
    options: any[];
    onChange: (opts: any[]) => void;
    value: any;
    placeholder?: any;
    disabled?: boolean;
}

export const DragSelect: FC<DragSelectProps> = ({
    options,
    onChange,
    value,
    placeholder,
    disabled,
}) => {
    const [selected, setSelected] = React.useState(value ?? []);

    const handleOnChange = selectedOptions => {
        setSelected(selectedOptions);
        onChange(selectedOptions);
    };

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newValue = arrayMove(selected, oldIndex, newIndex);
        setSelected(newValue);
        onChange(newValue);
    };

    return (
        <SortableSelect
            useDragHandle
            axis='xy'
            onSortEnd={onSortEnd}
            distance={4}
            getHelperDimensions={({ node }) => node.getBoundingClientRect()}
            //@ts-ignore
            styles={customStyles}
            isMulti
            isDisabled={disabled}
            options={options}
            value={selected}
            onChange={handleOnChange}
            components={{
                MultiValue: SortableMultiValue,
                MultiValueLabel: SortableMultiValueLabel,
            }}
            placeholder={placeholder}
            closeMenuOnSelect={false}
        />
    );
}
