import { Select } from 'antd';
import { FC } from 'react';

interface FlowStringArrayProps {
    initialValue?: any;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

const FlowStringArray: FC<FlowStringArrayProps> = ({ initialValue, onChange, disabled }) => {
    const handleChange = (cpfs: string) => {
        onChange(cpfs);
    };

    return (
        <Select
            mode='tags'
            disabled={disabled}
            defaultValue={initialValue}
            style={{ width: '100%' }}
            placeholder='CPFs'
            onChange={handleChange}
        >
            {initialValue &&
                initialValue.map((cpf: string) => (
                    <Select.Option key={cpf} value={cpf}>
                        {cpf}
                    </Select.Option>
                ))}
        </Select>
    );
};

export default FlowStringArray;
