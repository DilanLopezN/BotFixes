export interface CustomerFormProps {
    formik: any;
    formDisabled?: boolean;
    getCnpj: (params: any) => void;
    getCep: (params: any) => void;
    setup?: boolean;
}