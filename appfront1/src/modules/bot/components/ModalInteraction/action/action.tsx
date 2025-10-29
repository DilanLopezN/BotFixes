import { Form, Input } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { useContext } from 'react';
import { useLanguageContext } from '../../../../i18n/context';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { ActionProps } from './interfaces';

export const Action = ({ onChange, currentInteraction }: ActionProps) => {
    const [form] = useForm();
    const disabledFieldsContext = useContext(DisabledTypeContext);
    const { getTranslation } = useLanguageContext();

    if (!currentInteraction) return null;

    const initialAction = currentInteraction?.action?.toString() ?? '';

    return (
        <Form form={form} layout='vertical' initialValues={{ action: initialAction }}>
            <Form.Item
                label={getTranslation('Action')}
                tooltip={getTranslation('The action will trigger another trigger interaction')}
                name='action'
            >
                <Input
                    placeholder={getTranslation('Enter a action')}
                    size='large'
                    type='text'
                    disabled={disabledFieldsContext.disabledFields}
                    onChange={(event) => {
                        const value = event.target.value;
                        if (value !== undefined) {
                            onChange(value);
                        }
                    }}
                />
            </Form.Item>
        </Form>
    );
};
