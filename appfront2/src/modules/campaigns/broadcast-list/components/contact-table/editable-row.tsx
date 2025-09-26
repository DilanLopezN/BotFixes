import { Form } from 'antd';
import React from 'react';
import { EditableContext } from './editable-context';
import type { EditableRowProps } from './interfaces';

export const EditableRow = ({ index, ...props }: EditableRowProps) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};
