import { FormikValues } from 'formik';

export interface ImportContactsModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
    form: FormikValues;
    getTranslation: (text?: string) => string;
    workspaceId: string;
}
