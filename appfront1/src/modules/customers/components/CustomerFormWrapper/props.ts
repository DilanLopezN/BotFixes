import { Customer } from "../../page/Customers/interfaces";


export interface CustomerFormWrapperProps {
    onCancel: Function;
    addNotification: Function;
    customer?: Customer;
}