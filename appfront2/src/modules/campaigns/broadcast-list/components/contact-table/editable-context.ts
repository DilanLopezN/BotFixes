import { type FormInstance } from 'antd';
import { createContext } from 'react';

export const EditableContext = createContext<FormInstance<any> | null>(null);
